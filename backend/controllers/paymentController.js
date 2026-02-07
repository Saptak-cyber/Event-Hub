import stripe from '../config/stripe.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';

// @desc    Create payment intent for event registration
// @route   POST /api/payments/create-intent/:eventId
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(event.price * 100), // Convert to cents
      currency: 'inr', // Change to your currency
      metadata: {
        eventId: event._id.toString(),
        userId: user._id.toString(),
        eventTitle: event.title,
        userEmail: user.email,
        userName: user.name
      },
      description: `Registration for ${event.title}`,
      receipt_email: user.email,
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: event.price,
        eventTitle: event.title
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent: ' + error.message
    });
  }
};

// @desc    Confirm payment and complete registration
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured'
      });
    }

    const { paymentIntentId, eventId } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and event ID are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Verify the payment belongs to this user and event
    if (
      paymentIntent.metadata.userId !== userId ||
      paymentIntent.metadata.eventId !== eventId
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
      registration.paymentId = paymentIntentId;
      registration.amount = paymentIntent.amount / 100;
      
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
        paymentId: paymentIntentId,
        amount: paymentIntent.amount / 100
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

// @desc    Handle Stripe webhook events
// @route   POST /api/payments/webhook
// @access  Public (but verified by Stripe signature)
export const handleWebhook = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).send('Payment service not configured');
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('⚠️  Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('✅ Payment succeeded:', paymentIntent.id);
        
        // Update registration status
        const registration = await Registration.findOne({
          paymentId: paymentIntent.id
        });
        
        if (registration && registration.paymentStatus !== 'completed') {
          registration.paymentStatus = 'completed';
          await registration.save();
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
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

      case 'charge.refunded':
        const refund = event.data.object;
        console.log('💰 Refund processed:', refund.id);
        
        // Update registration to refunded
        const refundedRegistration = await Registration.findOne({
          paymentId: refund.payment_intent
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
        console.log(`Unhandled event type ${event.type}`);
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
    if (!stripe) {
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

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: registration.paymentId,
      reason: req.body.reason || 'requested_by_customer'
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
