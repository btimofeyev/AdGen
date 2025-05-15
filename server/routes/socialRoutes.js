// server/routes/socialRoutes.js
const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Protected routes - require authentication
router.post('/generate', verifyToken, socialController.generatePostIdeas);

router.post('/schedule', verifyToken, socialController.schedulePost);
router.get('/scheduled', verifyToken, socialController.getScheduledPosts);
router.delete('/scheduled/:id', verifyToken, socialController.deleteScheduledPost);



module.exports = router;