import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide event description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  dateTime: {
    type: Date,
    required: [true, 'Please provide event date and time']
  },
  duration: {
    type: Number, // Duration in hours
    default: 2
  },
  location: {
    type: String,
    required: [true, 'Please provide event location'],
    trim: true
  },
  venue: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  category: {
    type: String,
    required: [true, 'Please select event category'],
    enum: ['conference', 'workshop', 'seminar', 'webinar', 'meetup', 'networking', 'social', 'sports', 'cultural', 'tech', 'other']
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide event capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  registeredCount: {
    type: Number,
    default: 0
  },
  bannerImage: {
    type: String,
    // default: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/event-default.jpg`
    default: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1761209066/fq0m7elm79gkydtjj1hw.jpg`
    
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true
  }],
  requirements: {
    type: String,
    maxlength: [500, 'Requirements cannot be more than 500 characters']
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  allowWaitlist: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
eventSchema.index({ dateTime: 1, status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });

// Virtual to check if event is full
eventSchema.virtual('isFull').get(function() {
  return this.registeredCount >= this.capacity;
});

// Update event status based on date
eventSchema.methods.updateStatus = function() {
  const now = new Date();
  const eventDate = new Date(this.dateTime);
  const eventEndDate = new Date(eventDate.getTime() + (this.duration * 60 * 60 * 1000));

  if (this.status === 'cancelled') {
    return this.status;
  }

  if (now < eventDate) {
    this.status = 'upcoming';
  } else if (now >= eventDate && now < eventEndDate) {
    this.status = 'ongoing';
  } else if (now >= eventEndDate) {
    this.status = 'completed';
  }

  return this.status;
};

const Event = mongoose.model('Event', eventSchema);

export default Event;

