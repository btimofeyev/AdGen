// server/controllers/subscriptionController.js
const stripe = require("../lib/stripe");
const supabase = require("../lib/supabase");
const dotenv = require("dotenv");
dotenv.config();

// Create a Stripe Checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { priceId, planId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!priceId || !planId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Get user email from session
    const { data } = await supabase.auth.getSession();
    let userEmail;

    if (data?.session?.user?.email) {
      userEmail = data.session.user.email;
    } else if (req.user.email) {
      userEmail = req.user.email;
    } else {
      return res.status(500).json({ error: "Failed to fetch user email" });
    }

    // Check if customer exists in Stripe
    let { data: customerData } = await supabase
      .from("user_payment_details")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId;

    // If customer doesn't exist, create one
    if (!customerData?.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: userId },
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabase.from("user_payment_details").insert({
        user_id: userId,
        stripe_customer_id: customerId,
      });
    } else {
      customerId = customerData.stripe_customer_id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: planId !== "pay-as-you-go" ? "subscription" : "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
};

// Handle webhook events from Stripe
exports.webhookHandler = async (req, res) => {
    // 1️⃣ Pull the header into `sig`
    const sig = req.headers["stripe-signature"];
    console.log("⚡️ Stripe webhook hit!", {
      sig,
      rawBodyLength: req.body.length,
    });
  
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error(
        "⚠️ Missing webhook signature or secret",
        { sig, secret: process.env.STRIPE_WEBHOOK_SECRET }
      );
      return res.status(400).send("Missing webhook signature or secret");
    }
  
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("⚠️ Signature validation failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    console.log("✅ Webhook validated, type =", event.type);
  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.user_id;
    const planId = session.metadata.plan_id;

    if (!userId || !planId) {
      console.error("Missing metadata in session:", session.id);
      return res.status(200).json({ received: true });
    }

    try {
      // Determine credits based on plan
      let credits = 0;
      if (planId === "pay-as-you-go") {
        credits = 15;
      } else if (planId === "starter") {
        credits = 50;
      } else if (planId === "pro") {
        credits = 200;
      } else if (planId === "premium") {
        credits = 400;
      }

      if (credits <= 0) {
        return res.status(200).json({ received: true });
      }

      // Add credits to user's account
      const { data: userData } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Insert or update user credits
      if (!userData) {
        await supabase.from("user_credits").insert({
          user_id: userId,
          available_credits: credits,
          total_credits_received: credits,
          credits_used: 0,
        });
      } else {
        await supabase
          .from("user_credits")
          .update({
            available_credits: userData.available_credits + credits,
            total_credits_received: userData.total_credits_received + credits,
          })
          .eq("user_id", userId);
      }

      // For subscriptions, create subscription record
      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );

        await supabase.from("subscriptions").insert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          plan_id: planId,
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          metadata: { credits_per_cycle: credits },
        });
      }

      // Record the transaction
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: credits,
        transaction_type:
          session.mode === "subscription"
            ? "subscription_creation"
            : "purchase",
        metadata: {
          session_id: session.id,
          plan_id: planId,
        },
      });
    } catch (error) {
      console.error("Error processing checkout session:", error);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};
