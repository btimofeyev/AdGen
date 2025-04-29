// server/routes/subscriptionRoutes.js
const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { verifyToken } = require("../middleware/auth");

// CREATE checkout session (your frontend calls this)
router.post(
  "/create-checkout-session",
  verifyToken,
  subscriptionController.createCheckoutSession
);
router.get(
    '/verify-session',
    verifyToken,
    subscriptionController.verifySession
  );
router.post("/create-portal-session", verifyToken, subscriptionController.createPortalSession);
module.exports = router;
