import { getStripeInstance } from '../config/stripe.js';

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
  }
};

export default StripeService;
