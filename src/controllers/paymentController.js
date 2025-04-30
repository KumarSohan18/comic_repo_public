import Razorpay from 'razorpay';
import crypto from 'crypto';
import userModel from '../models/userModel.js';
import dotenv from 'dotenv';
import { query } from '../config/db.js';

// Load environment variables
dotenv.config();

// Check if Razorpay credentials are set
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// console.log('Razorpay Key ID available:', !!RAZORPAY_KEY_ID);
// console.log('Razorpay Key Secret available:', !!RAZORPAY_KEY_SECRET);

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Constants for payment plans
const PAYMENT_PLANS = {
  BASIC: {
    amount: 499, // ₹499
    credits: 100,
    sceneLimit: 30  // Adding scene limit to the plan
  }
  // Add more plans as needed
};

export const createOrder = async (req, res) => {
  try {
    console.log('Create order request received:', req.body);
    
    // Validate authentication
    if (!req.user) {
      console.error('Create order failed: User object not found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Use either id from user object or userId from request
    const userId = req.user.id !== undefined ? req.user.id : req.userId;
    
    if (userId === undefined || userId === null) {
      console.error('Create order failed: User ID not found', { user: req.user, userId: req.userId });
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    console.log('Authenticated user ID:', userId);
    
    const { planType = 'BASIC' } = req.body;
    const plan = PAYMENT_PLANS[planType];
    
    if (!plan) {
      console.error('Create order failed: Invalid plan type', planType);
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    console.log('Creating order with plan:', planType, 'Amount:', plan.amount);
    
    const options = {
      amount: plan.amount * 100, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    console.log('Creating Razorpay order with options:', options);
    
    // Validate Razorpay credentials before creating order
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Create order failed: Missing Razorpay credentials');
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }
    
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);
    
    // Update user with order details - use userId instead of req.user.id
    await userModel.updateUserOrder(
      userId,
      order.id,
      plan.amount,
      'pending'
    );
    console.log('User order updated in database');

    const response = {
      orderId: order.id,
      amount: plan.amount * 100, // Send amount in paise as expected by Razorpay
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID, // Make sure this matches the property name expected by frontend
    };
    
    console.log('Sending order response with keyId:', RAZORPAY_KEY_ID);
    res.json(response);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    console.log('Payment verification request received:', req.body);
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Detailed logging
    console.log(`Exact razorpay_order_id: '${razorpay_order_id}'`);
    console.log(`Type: ${typeof razorpay_order_id}, Length: ${razorpay_order_id.length}`);
    console.log(`Character codes:`, Array.from(razorpay_order_id).map(c => c.charCodeAt(0)));

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Verification failed: Missing required parameters');
      return res.status(400).json({ 
        error: 'Missing payment verification parameters' 
      });
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      console.error('Verification failed: Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    console.log('Payment signature verified successfully');
    
    // Double check the database directly
    let userId = null;
    
    try {
      const [directCheck] = await query("SELECT id, order_id FROM users WHERE order_id = ?", [razorpay_order_id]);
      console.log(`Direct DB check for '${razorpay_order_id}':`, directCheck);
      
      // Check if directCheck exists and has contents
      if (directCheck && Array.isArray(directCheck) && directCheck.length > 0) {
        userId = directCheck[0].id;
        console.log(`Found user ID in DB check: ${userId}`);
      } else if (directCheck && typeof directCheck === 'object' && directCheck.id !== undefined) {
        // Handle case where MySQL returns an object directly instead of an array
        userId = directCheck.id;
        console.log(`Found user ID (direct object): ${userId}`);
      } else {
        console.error('Direct check returned empty result:', directCheck);
        return res.status(404).json({ error: 'Order not found in database' });
      }
    } catch (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ error: 'Database query failed', details: error.message });
    }
    
    if (userId === null) {
      console.error('Verification failed: Could not extract valid user ID');
      return res.status(404).json({ error: 'Valid user ID not found' });
    }
    
    console.log(`Processing payment for user ID: ${userId}`);
    
    // Update payment status and add credits directly
    try {
      await userModel.completePayment(
        userId,
        razorpay_payment_id,
        'completed',
        PAYMENT_PLANS.BASIC.credits,
        PAYMENT_PLANS.BASIC.sceneLimit 
      );
      
      console.log('Payment completed and credits added for user:', userId);
  
      return res.json({
        success: true,
        message: 'Payment verified successfully',
        credits: PAYMENT_PLANS.BASIC.credits
      });
    } catch (paymentError) {
      console.error('Error updating payment status:', paymentError);
      return res.status(500).json({ 
        error: 'Payment verification succeeded but updating user failed',
        details: paymentError.message
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment', details: error.message });
  }
}; 