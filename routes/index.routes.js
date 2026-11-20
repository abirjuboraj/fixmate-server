import { Router } from 'express';
import healthRoutes from './health.routes.js';
import PaymentRoutes from './payment.routes.js';
import servicesRoutes from './services.routes.js'
import usersRoutes from './users.routes.js'
import userProfileRoute from './user-profile.routes.js'
import adminServicesRoutes from './admin-services.routes.js'
import bookingsRoutes from './booking.routes.js'
import adminBookingRoutes from './admin-booking.routes.js'
import adminTransactionRoutes from './admin-transaction.routes.js'

const router = Router();

// Mount standard JSON-based API sub-routes
router.use('/health', healthRoutes);
router.use('/services', servicesRoutes)
router.use('/payment', PaymentRoutes);
router.use('/user', userProfileRoute)
router.use('/bookings', bookingsRoutes)
router.use('/admin/users', usersRoutes)
router.use('/admin/services', adminServicesRoutes)
router.use('/admin/bookings', adminBookingRoutes)
router.use('/admin/transactions', adminTransactionRoutes)



export default router;
