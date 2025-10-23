import User from '../models/User.js';
import { sendTokenResponse } from '../middleware/auth.js';
import { getTokensFromCode,getAuthUrl } from '../config/googleCalendar.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Save Google Calendar tokens
// @route   POST /api/auth/google/callback
// @access  Private
// export const saveGoogleTokens = async (req, res) => {
//   try {
//     // const { code } = req.body;
//     const { code } = req.query;

//     if (!code) {
//       return res.status(400).json({
//         success: false,
//         message: 'Authorization code is required'
//       });
//     }

//     // Get tokens from authorization code
//     const tokens = await getTokensFromCode(code);

//     // Save tokens to user
//     await User.findByIdAndUpdate(req.user.id, {
//       googleCalendarTokens: tokens
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Google Calendar connected successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to connect Google Calendar: ' + error.message
//     });
//   }
// };
export const saveGoogleTokens = async (req, res) => {
  try {
    const { code, state } = req.query; // Get both code and state (user ID)

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get tokens from authorization code
    const tokens = await getTokensFromCode(code);

    // Save tokens to user using state parameter as user ID
    await User.findByIdAndUpdate(state, {
      googleCalendarTokens: tokens
    });

    res.status(200).json({
      success: true,
      message: 'Google Calendar connected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save Google tokens: ' + error.message
    });
  }
};

// Add this function to authController.js
// export const getGoogleAuthUrl = async (req, res) => {
//   try {
//     const authUrl = getAuthUrl();
//     res.status(200).json({
//       success: true,
//       authUrl: authUrl
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to generate Google auth URL: ' + error.message
//     });
//   }
// };
export const getGoogleAuthUrl = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not configured. Please set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file'
      });
    }

    const authUrl = getAuthUrl(req.user.id); // Pass user ID
    res.status(200).json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate Google auth URL: ' + error.message
    });
  }
};