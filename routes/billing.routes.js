import { Router } from 'express';
import { createCheckoutSession } from '../controllers/billing.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { validateCreateCheckoutSession } from '../validators/billing.validator.js';

const router = Router();

/**
 * Route to create a checkout session (payment or subscription)
 */
router.post(
  '/create-checkout-session',
  validate(validateCreateCheckoutSession),
  createCheckoutSession
);

export default router;
