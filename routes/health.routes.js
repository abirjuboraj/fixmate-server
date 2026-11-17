import { Router } from 'express';

const router = Router();

/**
 * Health check endpoint.
 * Returns server timestamp and status.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString()
  });
});

export default router;
