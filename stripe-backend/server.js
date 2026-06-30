require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

if (!stripeSecretKey || !stripePublishableKey) {
  console.error("Missing STRIPE_SECRET_KEY or STRIPE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const stripe = Stripe(stripeSecretKey);
const app = express();
app.use(cors());
app.use(express.json());

app.post("/payment-sheet", async (req, res) => {
  try {
    const customer = await stripe.customers.create();

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" },
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500,
      currency: "eur",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: stripePublishableKey,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Backend Stripe sur http://localhost:${PORT}`),
);
