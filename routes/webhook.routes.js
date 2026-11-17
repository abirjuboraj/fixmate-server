import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/webhook.controller.js';

const router = Router();

/**
 * Webhook listener route.
 * Raw body parsing is mounted at the app level for this route.
 */
router.post('/stripe', handleStripeWebhook);

export default router;
