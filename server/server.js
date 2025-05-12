// Update to server.js to include social routes
// server/server.js (updated)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const subscriptionController = require("./controllers/subscriptionController");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const imageRoutes = require("./routes/imageRoutes");
const userRoutes = require("./routes/userRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const socialRoutes = require("./routes/socialRoutes"); // New import
const cron = require('node-cron');
const { cleanupExpiredImages, cleanupTemporaryFiles } = require('./controllers/imageController');
const { cleanupOrphanedUserStorage } = require('./utils/storageCleanup');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// 1️⃣ Mount the subscription webhook route *before* any body‐parsers:
app.post(
  "/api/subscriptions/webhook",
  express.raw({ type: "application/json" }),
  subscriptionController.webhookHandler
);

// 2️⃣ Now JSON‐parse for all your other routes:
app.use(express.json());
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api", imageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/social", socialRoutes); // New route

// Schedule regular cleanup jobs
cron.schedule('0 3 * * *', async () => {
  console.log('Running scheduled cleanup jobs');
  
  try {
    // Clean up expired generated images
    const imagesResult = await cleanupExpiredImages();
    console.log(`Image cleanup completed: ${imagesResult.deletedCount} images deleted`);
    
    // Clean up temporary uploaded files
    cleanupTemporaryFiles();
    console.log('Temporary file cleanup completed');
    
    // Clean up orphaned user storage
    const storageResult = await cleanupOrphanedUserStorage();
    console.log(`Orphaned storage cleanup completed: ${storageResult.cleanedDirectories} directories processed`);
  } catch (error) {
    console.error('Error in cleanup jobs:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `→ Webhook URL: http://localhost:${PORT}/api/subscriptions/webhook`
  );
  console.log(
    `→ User Deletion Webhook URL: http://localhost:${PORT}/api/webhooks/user-deleted`
  );
});