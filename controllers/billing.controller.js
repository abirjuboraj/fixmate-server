import asyncHandler from '../utils/asyncHandler.js';
import BillingService from '../services/billing.service.js';

/**
 * Controller to handle billing checkout session initiation.
 */
export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { customerEmail, mode, items, metadata } = req.body;

  const result = await BillingService.createCheckoutSession({
    customerEmail,
    mode,
    items,
    metadata
  });

  return res.status(200).json({
    success: true,
    message: 'Checkout session created successfully',
    data: result
  });
});

export default {
  createCheckoutSession
};
