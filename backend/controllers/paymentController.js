import razorpay from '../config/razorpay.js';
import crypto from 'crypto';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';

// @desc    Create Razorpay order for event registration
// @route   POST /api/payments/create-intent/:eventId
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured'
      });
    }

    const { eventId } = req.params;
    const userId = req.user.id;

    // Get event details
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event requires payment
    if (!event.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'This event is free'
      });
    }

    // Check if user already has a pending or completed registration
    const existingRegistration = await Registration.findOne({
      event: eventId,
      user: userId,
      status: { $ne: 'cancelled' }
    });

    if (existingRegistration && existingRegistration.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event'
      });
    }

    // Get user details
    const user = await User.findById(userId);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(event.price * 100), // Amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`, // Max 40 chars (Razorpay requirement)
      notes: {
        eventId: event._id.toString(),
        userId: user._id.toString(),
        eventTitle: event.title,
        userEmail: user.email,
        userName: user.name
      }
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: event.price,
        eventTitle: event.title,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order: ' + error.message
    });
  }
};

// @desc    Verify Razorpay payment and complete registration
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'All payment details are required'
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(401).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Fetch order details to verify metadata
    const order = await razorpay.orders.fetch(razorpay_order_id);

    // Verify the order belongs to this user and event
    if (
      order.notes.userId !== userId ||
      order.notes.eventId !== eventId
    ) {
      return res.status(401).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if registration already exists
    let registration = await Registration.findOne({
      event: eventId,
      user: userId,
      status: { $ne: 'cancelled' }
    });

    if (registration) {
      // Update existing registration
      registration.paymentStatus = 'completed';
      registration.paymentId = razorpay_payment_id;
      registration.amount = order.amount / 100;
      
      if (registration.status === 'waitlist' && event.registeredCount < event.capacity) {
        registration.status = 'confirmed';
        event.registeredCount += 1;
        event.attendees.push(userId);
      }
      
      await registration.save();
      await event.save();
    } else {
      // Create new registration
      let registrationStatus = 'confirmed';
      
      if (event.registeredCount >= event.capacity) {
        if (event.allowWaitlist) {
          registrationStatus = 'waitlist';
        } else {
          return res.status(400).json({
            success: false,
            message: 'Event is full and waitlist is not available'
          });
        }
      }

      registration = await Registration.create({
        event: eventId,
        user: userId,
        status: registrationStatus,
        paymentStatus: 'completed',
        paymentId: razorpay_payment_id,
        amount: order.amount / 100
      });

      if (registrationStatus === 'confirmed') {
        event.registeredCount += 1;
        event.attendees.push(userId);
        await event.save();
      }
    }

    await registration.populate('event');
    await registration.populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Payment confirmed and registration completed',
      data: registration
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment: ' + error.message
    });
  }
};

// @desc    Handle Razorpay webhook events
// @route   POST /api/payments/webhook
// @access  Public (but verified by Razorpay signature)
export const handleWebhook = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).send('Payment service not configured');
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('⚠️  Razorpay webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('⚠️  Webhook signature verification failed');
      return res.status(400).send('Webhook signature verification failed');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle the event
    switch (event) {
      case 'payment.captured':
        const payment = payload.payment.entity;
        console.log('✅ Payment captured:', payment.id);
        
        // Update registration status
        const registration = await Registration.findOne({
          paymentId: payment.id
        });
        
        if (registration && registration.paymentStatus !== 'completed') {
          registration.paymentStatus = 'completed';
          await registration.save();
        }
        break;

      case 'payment.failed':
        const failedPayment = payload.payment.entity;
        console.log('❌ Payment failed:', failedPayment.id);
        
        // Update registration to failed
        const failedRegistration = await Registration.findOne({
          paymentId: failedPayment.id
        });
        
        if (failedRegistration) {
          failedRegistration.paymentStatus = 'failed';
          await failedRegistration.save();
        }
        break;

      case 'refund.created':
        const refund = payload.refund.entity;
        console.log('💰 Refund processed:', refund.id);
        
        // Update registration to refunded
        const refundedRegistration = await Registration.findOne({
          paymentId: refund.payment_id
        });
        
        if (refundedRegistration) {
          refundedRegistration.paymentStatus = 'refunded';
          refundedRegistration.status = 'cancelled';
          await refundedRegistration.save();
          
          // Update event capacity
          const eventToUpdate = await Event.findById(refundedRegistration.event);
          if (eventToUpdate) {
            eventToUpdate.registeredCount -= 1;
            eventToUpdate.attendees.pull(refundedRegistration.user);
            await eventToUpdate.save();
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook handler failed: ' + error.message
    });
  }
};

// @desc    Refund a payment
// @route   POST /api/payments/refund/:registrationId
// @access  Private/Admin
export const refundPayment = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured'
      });
    }

    const registration = await Registration.findById(req.params.registrationId).populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const event = registration.event;

    // Check authorization
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to refund this payment'
      });
    }

    if (registration.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    if (!registration.paymentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment ID found for this registration'
      });
    }

    // Create refund in Razorpay
    const refund = await razorpay.payments.refund(registration.paymentId, {
      amount: Math.round(registration.amount * 100), // Full refund in paise
      notes: {
        reason: req.body.reason || 'requested_by_customer',
        registrationId: registration._id.toString()
      }
    });

    // Update registration
    registration.paymentStatus = 'refunded';
    registration.status = 'cancelled';
    await registration.save();

    // Update event capacity
    if (registration.status === 'confirmed') {
      event.registeredCount -= 1;
      event.attendees.pull(registration.user);
      await event.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: refund
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment: ' + error.message
    });
  }
};
