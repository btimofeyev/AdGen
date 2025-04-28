const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Create Payment Intent
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router; 