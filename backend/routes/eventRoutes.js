import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadBanner,
  getEventsByOrganizer,
  getMyOrganizedEvents,
  getEventStats
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEvent);
router.get('/organizer/:id', getEventsByOrganizer);

// Protected routes
router.use(protect);

// Admin routes
router.post('/', authorize('admin'), createEvent);
router.put('/:id', authorize('admin'), updateEvent);
router.delete('/:id', authorize('admin'), deleteEvent);
router.post('/:id/banner', authorize('admin'), upload.single('banner'), uploadBanner);
router.get('/my/organized', authorize('admin'), getMyOrganizedEvents);
router.get('/:id/stats', authorize('admin'), getEventStats);

export default router;

