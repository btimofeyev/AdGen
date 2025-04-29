
// server/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken } = require('../middleware/auth');

// CREATE checkout session (your frontend calls this)
router.post(
    '/create-checkout-session',
    verifyToken,
    subscriptionController.createCheckoutSession
  );
  
  module.exports = router;
  