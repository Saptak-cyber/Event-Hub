import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  refundPayment
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Webhook must be before express.json() middleware to get raw body
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-intent/:eventId', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.post('/refund/:registrationId', protect, authorize('admin'), refundPayment);

export default router;
