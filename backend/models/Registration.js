import mongoose from 'mongoose';
import crypto from 'crypto';

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
  },
  qrCode: {
    type: String
  },
  ticketNumber: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

// Index for faster queries
registrationSchema.index({ user: 1, status: 1 });
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ registeredAt: 1 });
registrationSchema.index({ ticketNumber: 1 });

// Generate ticket number before saving
registrationSchema.pre('save', function(next) {
  if (!this.ticketNumber && this.status === 'confirmed') {
    // Generate unique ticket number
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    this.ticketNumber = `TKT-${timestamp}-${randomStr}`;
  }
  next();
});

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;

