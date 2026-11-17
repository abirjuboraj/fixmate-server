import Stripe from 'stripe';

let stripeInstance = null;

/**
 * Returns a configured Stripe instance.
 * Lazily initializes using STRIPE_SECRET_KEY to prevent startup crash if not immediately needed.
 *
 * @returns {Stripe}
 */
export const getStripeInstance = () => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables.');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia'
    });
  }
  return stripeInstance;
};

export default getStripeInstance;
