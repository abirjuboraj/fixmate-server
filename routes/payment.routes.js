import { Router } from 'express';
import {
  createCheckoutSession,
  verifyCheckoutSession,
  getMyPayments,
} from '../controllers/payment.controller.js';
import { verifyToken, verifyCustomer } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * POST /api/payment/create-checkout-session
 * Customer creates a Stripe Checkout session for a completed repair.
 */
router.post(
  '/create-checkout-session',
  verifyToken,
  verifyCustomer,
  createCheckoutSession
);

/**
 * GET /api/payment/verify-session?session_id=...
 * Customer verifies payment status on success page (non-webhook flow).
 * Automatically updates booking status to 'paid' and creates payment record.
 */
router.get(
  '/verify-session',
  verifyToken,
  verifyCustomer,
  verifyCheckoutSession
);

/**
 * GET /api/payment/my-payments
 * Fetches all past payment records for the logged-in customer.
 */
router.get(
  '/my-payments',
  verifyToken,
  verifyCustomer,
  getMyPayments
);

export default router;
