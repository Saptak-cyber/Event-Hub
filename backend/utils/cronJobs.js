import cron from 'node-cron';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import { sendEventReminder } from '../config/email.js';

// Send reminders 24 hours before event
const sendOneDayReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find events happening in the next 24-25 hours
    const upcomingEvents = await Event.find({
      dateTime: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: 'upcoming',
      isActive: true
    });

    console.log(`Found ${upcomingEvents.length} events for 24-hour reminders`);

    for (const event of upcomingEvents) {
      // Find all confirmed registrations that haven't received 1-day reminder
      const registrations = await Registration.find({
        event: event._id,
        status: 'confirmed',
        'remindersSent.oneDayBefore': false
      }).populate('user');

      for (const registration of registrations) {
        const user = registration.user;
        
        // Send reminder email
        await sendEventReminder(
          user.email,
          user.name,
          {
            title: event.title,
            dateTime: event.dateTime,
            location: event.location
          },
          'in 24 hours'
        );

        // Mark reminder as sent
        registration.remindersSent.oneDayBefore = true;
        await registration.save();

        console.log(`Sent 24-hour reminder to ${user.email} for event: ${event.title}`);
      }
    }
  } catch (error) {
    console.error('Error sending 24-hour reminders:', error);
  }
};

// Send reminders 1 hour before event
const sendOneHourReminders = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find events happening in the next 1-2 hours
    const upcomingEvents = await Event.find({
      dateTime: {
        $gte: oneHourLater,
        $lt: twoHoursLater
      },
      status: 'upcoming',
      isActive: true
    });

    console.log(`Found ${upcomingEvents.length} events for 1-hour reminders`);

    for (const event of upcomingEvents) {
      // Find all confirmed registrations that haven't received 1-hour reminder
      const registrations = await Registration.find({
        event: event._id,
        status: 'confirmed',
        'remindersSent.oneHourBefore': false
      }).populate('user');

      for (const registration of registrations) {
        const user = registration.user;
        
        // Send reminder email
        await sendEventReminder(
          user.email,
          user.name,
          {
            title: event.title,
            dateTime: event.dateTime,
            location: event.location
          },
          'in 1 hour'
        );

        // Mark reminder as sent
        registration.remindersSent.oneHourBefore = true;
        await registration.save();

        console.log(`Sent 1-hour reminder to ${user.email} for event: ${event.title}`);
      }
    }
  } catch (error) {
    console.error('Error sending 1-hour reminders:', error);
  }
};

// Update event statuses
const updateEventStatuses = async () => {
  try {
    const events = await Event.find({
      status: { $in: ['upcoming', 'ongoing'] },
      isActive: true
    });

    for (const event of events) {
      const oldStatus = event.status;
      event.updateStatus();
      
      if (oldStatus !== event.status) {
        await event.save();
        console.log(`Updated event ${event.title} status from ${oldStatus} to ${event.status}`);
      }
    }
  } catch (error) {
    console.error('Error updating event statuses:', error);
  }
};

// Initialize cron jobs
export const initializeCronJobs = () => {
  // Run every day at 9 AM for 24-hour reminders
  cron.schedule('0 9 * * *', () => {
    console.log('Running 24-hour reminder job...');
    sendOneDayReminders();
  });

  // Run every hour for 1-hour reminders
  cron.schedule('0 * * * *', () => {
    console.log('Running 1-hour reminder job...');
    sendOneHourReminders();
  });

  // Update event statuses every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    console.log('Updating event statuses...');
    updateEventStatuses();
  });

  console.log('Cron jobs initialized successfully');
};

export default initializeCronJobs;

