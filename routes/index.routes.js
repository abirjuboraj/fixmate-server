import { Router } from 'express';
import healthRoutes from './health.routes.js';
import billingRoutes from './billing.routes.js';
import servicesRoutes from './services.routes.js'
import usersRoutes from './users.routes.js'

const router = Router();

// Mount standard JSON-based API sub-routes
router.use('/health', healthRoutes);
router.use('/services', servicesRoutes)
router.use('/billing', billingRoutes);
router.use('/admin/users', usersRoutes)

export default router;
