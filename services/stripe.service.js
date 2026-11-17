import { getStripeInstance } from '../config/stripe.js';
import ApiError from '../utils/ApiError.js';

/**
 * Stripe Service
 * Encapsulates direct communication with the Stripe API.
 */
export const StripeService = {
  /**
   * Creates a Stripe Checkout Session for one-time payment or subscription.
   *
   * @param {object} params
   * @param {string} params.customerEmail - Customer email
   * @param {'payment'|'subscription'} params.mode - Stripe session mode
   * @param {Array} params.lineItems - Verified line items
   * @param {string} [params.successUrl] - Optional custom redirect URL
   * @param {string} [params.cancelUrl] - Optional custom cancel URL
   * @param {object} [params.metadata] - Key-value metadata
   * @returns {Promise<import('stripe').Stripe.Checkout.Session>}
   */
  async createCheckoutSession({
    customerEmail,
    mode = 'payment',
    lineItems,
    successUrl,
    cancelUrl,
    metadata = {}
  }) {
    const stripe = getStripeInstance();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode,
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: successUrl || process.env.CLIENT_SUCCESS_URL || 'http://localhost:3000/payment/success',
      cancel_url: cancelUrl || process.env.CLIENT_CANCEL_URL || 'http://localhost:3000/payment/cancel',
      metadata
    });

    return session;
  },

  /**
   * Verifies and constructs a webhook event from the raw payload and signature header.
   *
   * @param {Buffer} rawPayload - Unparsed raw body buffer
   * @param {string} signature - Stripe-Signature header value
   * @returns {import('stripe').Stripe.Event}
   */
  constructWebhookEvent(rawPayload, signature) {
    const stripe = getStripeInstance();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new ApiError(500, 'STRIPE_WEBHOOK_SECRET is not configured on the server.');
    }

    try {
      return stripe.webhooks.constructEvent(rawPayload, signature, webhookSecret);
    } catch (err) {
      throw new ApiError(400, `Webhook signature verification failed: ${err.message}`);
    }
  }
};

export default StripeService;
