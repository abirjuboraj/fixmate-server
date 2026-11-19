import { Router } from 'express';
import healthRoutes from './health.routes.js';
import billingRoutes from './billing.routes.js';
import servicesRoutes from './services.routes.js'
import usersRoutes from './users.routes.js'
import userProfileRoute from './user-profile.routes.js'
import adminServicesRoutes from './admin-services.routes.js'
import bookingsRoutes from './booking.routes.js'

const router = Router();

// Mount standard JSON-based API sub-routes
router.use('/health', healthRoutes);
router.use('/services', servicesRoutes)
router.use('/billing', billingRoutes);
router.use('/user', userProfileRoute)
router.use('/admin/users', usersRoutes)
router.use('/admin/services', adminServicesRoutes)

router.use('/bookings', bookingsRoutes)

export default router;
