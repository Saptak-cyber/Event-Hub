import express from 'express';
import {
  getPlatformAnalytics,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getRevenueAnalytics,
  exportData
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Analytics routes
router.get('/analytics', getPlatformAnalytics);
router.get('/revenue', getRevenueAnalytics);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Export routes
router.get('/export/:type', exportData);

export default router;
