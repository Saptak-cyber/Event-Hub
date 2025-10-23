import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { cloudinary } from '../config/cloudinary.js';

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
    const { category, status, search, fromDate, toDate, visibility } = req.query;
    
    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // Default: show only active events
      query.isActive = true;
    }

    // Filter by visibility (admins can see all, users only public)
    if (visibility) {
      query.visibility = visibility;
    } else if (!req.user || req.user.role !== 'admin') {
      query.visibility = 'public';
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.dateTime = {};
      if (fromDate) {
        query.dateTime.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.dateTime.$lte = new Date(toDate);
      }
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ dateTime: 1 })
      .lean();

    // Update status for each event
    for (let event of events) {
      const eventDoc = await Event.findById(event._id);
      eventDoc.updateStatus();
      await eventDoc.save();
    }

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email phone avatar')
      .populate('attendees', 'name email avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update status
    event.updateStatus();
    await event.save();

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
export const createEvent = async (req, res) => {
  try {
    // Add organizer to req.body
    req.body.organizer = req.user.id;

    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

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
        message: 'Not authorized to update this event'
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

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
        message: 'Not authorized to delete this event'
      });
    }

    // Delete all registrations for this event
    await Registration.deleteMany({ event: req.params.id });

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload event banner
// @route   POST /api/events/:id/banner
// @access  Private/Admin
export const uploadBanner = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

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
        message: 'Not authorized to update this event'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'event-banners',
      transformation: [
        { width: 1200, height: 630, crop: 'fill' }
      ]
    });

    // Update event with image URL
    event.bannerImage = result.secure_url;
    await event.save();

    res.status(200).json({
      success: true,
      data: result.secure_url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get events by organizer
// @route   GET /api/events/organizer/:id
// @access  Public
export const getEventsByOrganizer = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.params.id })
      .sort({ dateTime: -1 })
      .populate('organizer', 'name email');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my organized events
// @route   GET /api/events/my/organized
// @access  Private/Admin
export const getMyOrganizedEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .sort({ dateTime: -1 })
      .populate('attendees', 'name email');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get event statistics
// @route   GET /api/events/:id/stats
// @access  Private/Admin
export const getEventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

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
        message: 'Not authorized to view event statistics'
      });
    }

    const registrations = await Registration.find({ event: req.params.id });

    const stats = {
      totalRegistrations: registrations.length,
      confirmedRegistrations: registrations.filter(r => r.status === 'confirmed').length,
      waitlistRegistrations: registrations.filter(r => r.status === 'waitlist').length,
      cancelledRegistrations: registrations.filter(r => r.status === 'cancelled').length,
      checkedIn: registrations.filter(r => r.checkInStatus === true).length,
      availableSeats: event.capacity - event.registeredCount,
      capacityPercentage: ((event.registeredCount / event.capacity) * 100).toFixed(2)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

