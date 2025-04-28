// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get user credits information
router.get('/credits', userController.getUserCredits);

// Get user transaction history
router.get('/transactions', userController.getTransactionHistory);

// Get current subscription information
router.get('/subscription', userController.getCurrentSubscription);

// Cancel subscription
router.post('/subscription/cancel', userController.cancelSubscription);

module.exports = router;