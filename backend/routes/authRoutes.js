import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword,
  saveGoogleTokens,
  getGoogleAuthUrl,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

import { getAuthUrl } from '../config/googleCalendar.js';


// Get Google OAuth URL
router.get('/google/url', protect, getGoogleAuthUrl);

// Handle Google OAuth callback
// router.post('/google/callback', protect, saveGoogleTokens);
router.get('/google/callback', saveGoogleTokens);

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

export default router;

