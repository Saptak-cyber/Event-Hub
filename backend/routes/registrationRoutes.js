import express from 'express';
import {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventRegistrations,
  checkInAttendee,
  addToGoogleCalendar,
  getRegistration
} from '../controllers/registrationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User routes
router.post('/:eventId', registerForEvent);
router.delete('/:registrationId', cancelRegistration);
router.get('/my', getMyRegistrations);
router.get('/:registrationId', getRegistration);
router.post('/:registrationId/add-to-calendar', addToGoogleCalendar);

// Admin routes
router.get('/event/:eventId', authorize('admin'), getEventRegistrations);
router.put('/:registrationId/checkin', authorize('admin'), checkInAttendee);

export default router;

