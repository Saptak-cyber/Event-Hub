import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'waitlist', 'cancelled'],
    default: 'confirmed'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'not_required'],
    default: 'not_required'
  },
  paymentId: {
    type: String
  },
  amount: {
    type: Number,
    default: 0
  },
  checkInStatus: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  remindersSent: {
    oneDayBefore: {
      type: Boolean,
      default: false
    },
    oneHourBefore: {
      type: Boolean,
      default: false
    }
  },
  addedToCalendar: {
    type: Boolean,
    default: false
  },
  calendarEventId: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
// registrationSchema.index({ event: 1, user: 1 }, { unique: true });

// Index for faster queries
registrationSchema.index({ user: 1, status: 1 });
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ registeredAt: 1 });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;

