import { Router } from 'express';
import {
  createCheckoutSession,
  verifyCheckoutSession,
  getMyPayments,
} from '../controllers/payment.controller.js';
import { verifyToken, verifyCustomer } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
  '/create-checkout-session',
  verifyToken,
  verifyCustomer,
  createCheckoutSession
);

router.get(
  '/verify-session',
  verifyToken,
  verifyCustomer,
  verifyCheckoutSession
);


router.get(
  '/my-payments',
  verifyToken,
  verifyCustomer,
  getMyPayments
);

export default router;
