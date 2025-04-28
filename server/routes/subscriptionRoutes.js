// server/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Create a Stripe Checkout session
router.post('/create-checkout-session', subscriptionController.createCheckoutSession);

// Verify Stripe Checkout session
router.get('/verify-session', subscriptionController.verifySession);

// Create a subscription setup intent
router.post('/create-subscription', subscriptionController.createSubscription);

// Finalize subscription after payment method confirmation
router.post('/finalize', subscriptionController.finalizeSubscription);

// Activate free trial (3 images)
router.post('/activate-free', subscriptionController.activateFreePlan);

// Process one-time purchases
router.post('/purchase', subscriptionController.createOneTimePurchase);

// Route for Stripe webhook (no authentication required)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Handle raw body for Stripe webhook signature verification
    if (req.originalUrl.includes('/webhook')) {
      next();
    } else {
      express.json()(req, res, next);
    }
  },
  subscriptionController.webhookHandler
);

module.exports = router;