import asyncHandler from '../utils/asyncHandler.js';
import StripeService from '../services/stripe.service.js';
import BillingService from '../services/billing.service.js';
import ApiError from '../utils/ApiError.js';

/**
 * Controller to handle incoming Stripe webhook events.
 * Uses raw body buffer for cryptographically verifying Stripe signature.
 */
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    throw new ApiError(400, 'Missing Stripe-Signature header.');
  }

  // Construct and verify event using raw payload buffer
  const event = StripeService.constructWebhookEvent(req.body, signature);

  // Process event in billing service
  const result = await BillingService.handleWebhookEvent(event);

  return res.status(200).json(result);
});

export default {
  handleStripeWebhook
};
