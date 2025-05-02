// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);


router.get('/credits', userController.getUserCredits);

router.post('/credits/free-trial', userController.addFreeTrialCredits);
router.get('/transactions', userController.getTransactionHistory);
router.get('/subscription', userController.getCurrentSubscription);
router.post('/subscription/cancel', userController.cancelSubscription);

module.exports = router;