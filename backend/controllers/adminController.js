import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';

// @desc    Get platform-wide analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Overall counts
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const activeEvents = await Event.countDocuments({ 
      status: { $in: ['upcoming', 'ongoing'] },
      isActive: true 
    });

    // Revenue analytics
    const revenueData = await Registration.aggregate([
      { $match: { paymentStatus: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const paidRegistrations = revenueData.length > 0 ? revenueData[0].count : 0;

    // Event category distribution
    const categoryDistribution = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // User growth (new users in time range)
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Event growth
    const newEvents = await Event.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Registration growth
    const newRegistrations = await Registration.countDocuments({
      registeredAt: { $gte: startDate }
    });

    // Top events by registrations
    const topEvents = await Event.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'event',
          as: 'registrations'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          dateTime: 1,
          registrationCount: { $size: '$registrations' }
        }
      },
      { $sort: { registrationCount: -1 } },
      { $limit: 10 }
    ]);

    // Daily registration trends
    const registrationTrends = await Registration.aggregate([
      {
        $match: {
          registeredAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$registeredAt' }
          },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Event status breakdown
    const eventStatusBreakdown = await Event.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Check-in statistics
    const checkInStats = await Registration.aggregate([
      {
        $match: { status: 'confirmed' }
      },
      {
        $group: {
          _id: null,
          totalConfirmed: { $sum: 1 },
          checkedIn: {
            $sum: { $cond: ['$checkInStatus', 1, 0] }
          }
        }
      }
    ]);

    const checkInRate = checkInStats.length > 0
      ? ((checkInStats[0].checkedIn / checkInStats[0].totalConfirmed) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalEvents,
          totalRegistrations,
          activeEvents,
          totalRevenue,
          paidRegistrations,
          averageRevenuePerEvent: totalEvents > 0 ? (totalRevenue / totalEvents).toFixed(2) : 0
        },
        growth: {
          timeRange,
          newUsers,
          newEvents,
          newRegistrations
        },
        categoryDistribution,
        topEvents,
        registrationTrends,
        eventStatusBreakdown,
        checkInRate
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user management data
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get registration count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const registrationCount = await Registration.countDocuments({
          user: user._id
        });
        const eventsOrganized = await Event.countDocuments({
          organizer: user._id
        });

        return {
          ...user.toObject(),
          stats: {
            registrationCount,
            eventsOrganized
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      page: pageNum,
      pages: Math.ceil(totalUsers / limitNum),
      data: usersWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user's registrations
    await Registration.deleteMany({ user: user._id });

    // Delete user's events
    await Event.deleteMany({ organizer: user._id });

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/admin/revenue
// @access  Private/Admin
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = { paymentStatus: 'completed' };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        matchQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Revenue by event
    const revenueByEvent = await Registration.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      { $unwind: '$eventDetails' },
      {
        $group: {
          _id: '$event',
          eventTitle: { $first: '$eventDetails.title' },
          totalRevenue: { $sum: '$amount' },
          ticketsSold: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 }
    ]);

    // Revenue by category
    const revenueByCategory = await Registration.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      { $unwind: '$eventDetails' },
      {
        $group: {
          _id: '$eventDetails.category',
          totalRevenue: { $sum: '$amount' },
          ticketsSold: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Monthly revenue trend
    const monthlyRevenue = await Registration.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Payment status breakdown
    const paymentStatusBreakdown = await Registration.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenueByEvent,
        revenueByCategory,
        monthlyRevenue,
        paymentStatusBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export data to CSV
// @route   GET /api/admin/export/:type
// @access  Private/Admin
export const exportData = async (req, res) => {
  try {
    const { type } = req.params;
    const { eventId } = req.query;

    let data = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = await User.find().select('-password').lean();
        filename = 'users_export.json';
        break;

      case 'events':
        data = await Event.find().populate('organizer', 'name email').lean();
        filename = 'events_export.json';
        break;

      case 'registrations':
        if (eventId) {
          data = await Registration.find({ event: eventId })
            .populate('user', 'name email phone')
            .populate('event', 'title dateTime location')
            .lean();
          filename = `registrations_${eventId}.json`;
        } else {
          data = await Registration.find()
            .populate('user', 'name email phone')
            .populate('event', 'title dateTime location')
            .lean();
          filename = 'all_registrations_export.json';
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Use: users, events, or registrations'
        });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
