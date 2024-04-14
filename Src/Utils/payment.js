import Stripe from "stripe";

async function paymentFunction({
  payment_method_types = ["card"],
  mode = "payment",
  customer_email = "",
  metadata = {},
  success_url,
  cancel_url,
  discounts = [],
  line_items = [],
} = {}) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const paymentData = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email, //optional
    metadata, //optional
    success_url,
    cancel_url,
    discounts, // optional
    line_items,
  });
  return paymentData;
}

export default paymentFunction;
