// server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const subscriptionController = require("./controllers/subscriptionController");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const imageRoutes = require("./routes/imageRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// 1️⃣ Mount the webhook route *before* any body‐parsers:
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `→ Webhook URL: http://localhost:${PORT}/api/subscriptions/webhook`
  );
});
