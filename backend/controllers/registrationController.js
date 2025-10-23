import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { sendRegistrationConfirmation } from '../config/email.js';
import { addEventToCalendar } from '../config/googleCalendar.js';

// @desc    Register for an event (RSVP)
// @route   POST /api/registrations/:eventId
// @access  Private
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check if event exists
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is active
    if (!event.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This event is no longer accepting registrations'
      });
    }

    // Check if event has already started or completed
    if (event.status === 'completed' || event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot register for ${event.status} event`
      });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      user: userId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check capacity
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

    // Create registration
    const registration = await Registration.create({
      event: eventId,
      user: userId,
      status: registrationStatus,
      paymentStatus: event.isPaid ? 'pending' : 'not_required',
      amount: event.isPaid ? event.price : 0
    });

    // Update event registered count and attendees
    if (registrationStatus === 'confirmed') {
      event.registeredCount += 1;
      event.attendees.push(userId);
      await event.save();
    }

    // Get user details
    const user = await User.findById(userId);

    // Send confirmation email
    await sendRegistrationConfirmation(user.email, user.name, {
      title: event.title,
      dateTime: event.dateTime,
      location: event.location,
      description: event.description
    });

    // Populate registration before sending response
    await registration.populate('event');
    await registration.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: registrationStatus === 'confirmed' 
        ? 'Successfully registered for the event' 
        : 'Added to waitlist',
      data: registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel registration
// @route   DELETE /api/registrations/:registrationId
// @access  Private
export const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Make sure user owns this registration
    if (registration.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this registration'
      });
    }

    // Update registration status
    const previousStatus = registration.status;
    registration.status = 'cancelled';
    await registration.save();

    // Update event if registration was confirmed
    if (previousStatus === 'confirmed') {
      const event = await Event.findById(registration.event);
      event.registeredCount -= 1;
      event.attendees.pull(registration.user);
      await event.save();

      // Move someone from waitlist to confirmed if available
      const waitlistRegistration = await Registration.findOne({
        event: registration.event,
        status: 'waitlist'
      }).sort({ registeredAt: 1 });

      if (waitlistRegistration) {
        waitlistRegistration.status = 'confirmed';
        await waitlistRegistration.save();
        
        event.registeredCount += 1;
        event.attendees.push(waitlistRegistration.user);
        await event.save();

        // Send confirmation email to waitlisted user
        const user = await User.findById(waitlistRegistration.user);
        await sendRegistrationConfirmation(user.email, user.name, {
          title: event.title,
          dateTime: event.dateTime,
          location: event.location,
          description: event.description
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's registrations
// @route   GET /api/registrations/my
// @access  Private
export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user.id })
      .populate({
        path: 'event',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get registrations for an event
// @route   GET /api/registrations/event/:eventId
// @access  Private/Admin
export const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Make sure user is event organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view registrations'
      });
    }

    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('user', 'name email phone avatar')
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check in attendee
// @route   PUT /api/registrations/:registrationId/checkin
// @access  Private/Admin
export const checkInAttendee = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId).populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const event = registration.event;

    // Make sure user is event organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to check in attendees'
      });
    }

    if (registration.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed registrations can be checked in'
      });
    }

    registration.checkInStatus = true;
    registration.checkInTime = new Date();
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      data: registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add event to Google Calendar
// @route   POST /api/registrations/:registrationId/add-to-calendar
// @access  Private
// export const addToGoogleCalendar = async (req, res) => {
//   try {
//     const registration = await Registration.findById(req.params.registrationId)
//       .populate('event');

//     if (!registration) {
//       return res.status(404).json({
//         success: false,
//         message: 'Registration not found'
//       });
//     }

//     // Make sure user owns this registration
//     if (registration.user.toString() !== req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized'
//       });
//     }

//     // Get user's Google Calendar tokens
//     const user = await User.findById(req.user.id);

//     if (!user.googleCalendarTokens || !user.googleCalendarTokens.access_token) {
//       return res.status(400).json({
//         success: false,
//         message: 'Google Calendar not connected. Please connect your Google Calendar first.'
//       });
//     }

//     // Add event to calendar
//     const event = registration.event;
//     const calendarEvent = await addEventToCalendar(
//       user.googleCalendarTokens.access_token,
//       {
//         title: event.title,
//         description: event.description,
//         location: event.location,
//         dateTime: event.dateTime
//       }
//     );

//     // Update registration
//     registration.addedToCalendar = true;
//     registration.calendarEventId = calendarEvent.id;
//     await registration.save();

//     res.status(200).json({
//       success: true,
//       message: 'Event added to Google Calendar successfully',
//       data: calendarEvent
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to add event to calendar: ' + error.message
//     });
//   }
// };
export const addToGoogleCalendar = async (req, res) => {
  try {
    console.log('=== Starting addToGoogleCalendar ===');
    console.log('Registration ID:', req.params.registrationId);
    console.log('User ID:', req.user.id);
    
    const registration = await Registration.findById(req.params.registrationId)
      .populate('event');

    if (!registration) {
      console.log('❌ Registration not found');
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    console.log('✅ Registration found:', registration._id);

    // Make sure user owns this registration
    if (registration.user.toString() !== req.user.id) {
      console.log('❌ User not authorized');
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    console.log('✅ User authorized');

    // Get user's Google Calendar tokens
    const user = await User.findById(req.user.id);
    console.log('User found:', user ? '✅' : '❌');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Google Calendar tokens:', user.googleCalendarTokens ? '✅ Present' : '❌ Missing');

    if (!user.googleCalendarTokens || !user.googleCalendarTokens.access_token) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected. Please connect your Google Calendar first.'
      });
    }

    console.log('✅ Google tokens found');

    // Add event to calendar
    const event = registration.event;
    console.log('Event details:', {
      title: event.title,
      description: event.description,
      location: event.location,
      dateTime: event.dateTime
    });
    
    console.log('Calling addEventToCalendar...');
    const calendarEvent = await addEventToCalendar(
      user.googleCalendarTokens.access_token,
      user.googleCalendarTokens.refresh_token,
      {
        title: event.title,
        description: event.description,
        location: event.location,
        dateTime: event.dateTime
      }
    );

    console.log('✅ Calendar event created:', calendarEvent);

    // Update registration
    registration.addedToCalendar = true;
    registration.calendarEventId = calendarEvent.id;
    await registration.save();

    console.log('✅ Registration updated');

    res.status(200).json({
      success: true,
      message: 'Event added to Google Calendar successfully',
      data: calendarEvent
    });
  } catch (error) {
    console.error('❌ Error in addToGoogleCalendar:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to add event to calendar: ' + error.message
    });
  }
};
// @desc    Get registration by ID
// @route   GET /api/registrations/:registrationId
// @access  Private
export const getRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId)
      .populate('event')
      .populate('user', 'name email phone');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Make sure user owns this registration or is the event organizer/admin
    const event = await Event.findById(registration.event);
    if (
      registration.user._id.toString() !== req.user.id &&
      event.organizer.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this registration'
      });
    }

    res.status(200).json({
      success: true,
      data: registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

