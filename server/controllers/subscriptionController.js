// server/controllers/subscriptionController.js

const stripe   = require("../lib/stripe");
const supabase = require("../lib/supabase");
const dotenv   = require("dotenv");
dotenv.config();

exports.createCheckoutSession = async (req, res) => {
  try {
    const { priceId, planId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!priceId || !planId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // 1) Get the user's email
    const { data: sessionData } = await supabase.auth.getSession();
    const userEmail = sessionData?.session?.user?.email || req.user.email;
    if (!userEmail) {
      return res.status(500).json({ error: "Failed to fetch user email" });
    }

    // 2) Lookup or create the Stripe customer
    let { data: pdRow } = await supabase
      .from("user_payment_details")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = pdRow?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
      await supabase.from("user_payment_details").insert({
        user_id: userId,
        stripe_customer_id: customerId,
      });
    }

    // 3) Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: planId === "pay-as-you-go" ? "payment" : "subscription",
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata:   { user_id: userId, plan_id: planId },
    });

    res.status(200).json({ sessionId: session.id });

  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * Handle incoming Stripe webhooks
 */
exports.webhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  console.log("⚡️ Stripe webhook hit!", { sig, rawBodyLength: req.body.length });

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("⚠️ Missing webhook signature or secret");
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId  = session.metadata.user_id;
    const plan    = session.metadata.plan_id;

    if (!userId || !plan) {
      console.error("Missing metadata in session:", session.id);
      return res.status(200).json({ received: true });
    }
    console.log(`Processing checkout for user ${userId}, plan ${plan}`);

    // ---- 1) Award credits ----
    const creditMap = {
      "pay-as-you-go": 15,
      starter:         50,
      pro:            200,
      premium:        500,
    };
    const creditAmount = creditMap[plan] || 0;

    if (creditAmount > 0) {
      try {
        // fetch or create user_credits
        const { data: creditsRow, error: creditsErr } = await supabase
          .from("user_credits")
          .select("available_credits, total_credits_received")
          .eq("user_id", userId)
          .maybeSingle();
        if (creditsErr) throw creditsErr;

        if (creditsRow) {
          // update
          await supabase
            .from("user_credits")
            .update({
              available_credits:       creditsRow.available_credits + creditAmount,
              total_credits_received:  creditsRow.total_credits_received + creditAmount,
              updated_at:              new Date().toISOString(),
            })
            .eq("user_id", userId);
          console.log(`Updated credits for ${userId}`);
        } else {
          // insert
          await supabase
            .from("user_credits")
            .insert({
              user_id:                userId,
              available_credits:      creditAmount,
              total_credits_received: creditAmount,
              credits_used:           0,
              created_at:             new Date().toISOString(),
              updated_at:             new Date().toISOString(),
            });
          console.log(`Created credits for ${userId}`);
        }

        // record transaction
        await supabase.from("credit_transactions").insert({
          user_id:          userId,
          amount:           creditAmount,
          transaction_type: session.mode === "subscription"
                             ? "subscription_creation"
                             : "purchase",
          metadata:         { plan_id: plan, session_id: session.id },
          created_at:       new Date().toISOString(),
        });
        console.log(`Recorded transaction for ${creditAmount} credits`);

      } catch (err) {
        console.error("Credits & transactions error:", err);
      }
    }

    // ---- 2) Persist subscription record ----
    if (session.mode === "subscription" && session.subscription) {
      try {
        // fetch full subscription details from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
        console.log(`Stripe sub: ${stripeSub.id} (${stripeSub.status})`);

        // call your stored proc
        const { error: rpcErr } = await supabase.rpc("create_subscription", {
          in_user_id:      userId,
          in_sub_id:       stripeSub.id,
          in_plan_id:      plan,
          in_status:       stripeSub.status,
          in_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
          in_period_end:   new Date(stripeSub.current_period_end   * 1000).toISOString(),
        });
        if (rpcErr) throw rpcErr;
        console.log("Created subscription via RPC");

        // Optionally fetch back *one* subscription record for logging
        const { data: rows, error: fetchErr } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("stripe_subscription_id", stripeSub.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (fetchErr) throw fetchErr;
        console.log("Subscription record:", rows[0]);

      } catch (err) {
        console.error("Subscription creation error:", err);
      }
    }
  }

  // Always ACK
  return res.status(200).json({ received: true });
};
exports.createPortalSession = async (req, res) => {
    try {
      const userId = req.user.id;
  
      // 1) Look up the Stripe customer ID
      const { data, error } = await supabase
        .from("user_payment_details")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data?.stripe_customer_id) {
        return res.status(404).json({ error: "No Stripe customer on file" });
      }
  
      // 2) Determine a fully‐qualified base URL
      let baseUrl = process.env.FRONTEND_URL;
      if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
        // fallback to the Origin header or construct from protocol+host
        baseUrl = req.get("origin") || `${req.protocol}://${req.get("host")}`;
        console.warn("FRONTEND_URL invalid or unset, falling back to:", baseUrl);
      }
      // strip trailing slash
      baseUrl = baseUrl.replace(/\/$/, "");
  
      // 3) Create the Stripe Billing Portal session
      const session = await stripe.billingPortal.sessions.create({
        customer:   data.stripe_customer_id,
        return_url: `${baseUrl}/account`
      });
  
      console.log("Redirecting to Stripe Portal with return_url:", `${baseUrl}/account`);
      return res.json({ url: session.url });
    } catch (err) {
      console.error("Error creating portal session:", err);
      return res.status(500).json({ error: "Failed to create portal session" });
    }
  };
  exports.verifySession = async (req, res) => {
    try {
      const { session_id } = req.query;
      if (!session_id) {
        return res.status(400).json({ error: 'Missing session_id' });
      }
      // Retrieve the Checkout Session from Stripe:
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription']
      });
      res.json({
        message: 'Session verified',
        session
      });
    } catch (err) {
      console.error('Error verifying session:', err);
      res.status(500).json({ error: 'Failed to verify session' });
    }
  };