// server/routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const { cleanupUserStorage } = require('../utils/storageCleanup');

// Endpoint to handle user deletion webhook
router.post('/user-deleted', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    // Check if this is a user deletion event
    if (type === 'DELETE' && data.table === 'users') {
      const userId = data.old.id;
      
      console.log(`Received webhook for user deletion: ${userId}`);
      
      // Perform storage cleanup for the deleted user
      const result = await cleanupUserStorage(userId);
      
      if (result.success) {
        console.log(`Cleaned up ${result.deletedCount} files for user ${userId}`);
        return res.status(200).json({ 
          message: 'User storage cleanup successful',
          deletedCount: result.deletedCount
        });
      } else {
        console.error(`Failed to clean up storage for user ${userId}:`, result.error);
        return res.status(500).json({ 
          error: 'Storage cleanup failed',
          details: result.error
        });
      }
    }
    
    // If not a user deletion event, just acknowledge
    res.status(200).json({ message: 'Webhook received, but no action taken' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alternative approach: Manual cleanup endpoint (requires authentication)
router.post('/cleanup-user/:userId', async (req, res) => {
  try {
    // This endpoint would be called manually after user deletion,
    // from an authenticated source like an admin panel
    const { userId } = req.params;
    
    // Verify the request is authenticated (using existing auth middleware)
    if (!req.user || !req.user.role === 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log(`Manual cleanup request for user: ${userId}`);
    
    // Perform storage cleanup
    const result = await cleanupUserStorage(userId);
    
    if (result.success) {
      return res.status(200).json({ 
        message: 'User storage cleanup successful',
        deletedCount: result.deletedCount
      });
    } else {
      return res.status(500).json({ 
        error: 'Storage cleanup failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error processing manual cleanup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;