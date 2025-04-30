import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes - require authentication
router.post('/create-order', authenticateToken, createOrder);
router.post('/verify-payment', authenticateToken, verifyPayment);

export default router; 