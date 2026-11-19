import { Router } from "express";
import { verifyToken, verifyCustomer, verifyTechnician } from "../middlewares/auth.middleware.js";
import { cancelBooking, createBooking, getMyBookings, getTechnicianBookings, updateStatus } from "../controllers/bookings.controller.js";

const router = Router();

router.post("/", verifyToken, verifyCustomer, createBooking);

router.get("/own", verifyToken, verifyCustomer, getMyBookings);

router.patch('/:id/cancel', verifyToken, verifyCustomer, cancelBooking);

router.get('/technician', verifyToken, verifyTechnician, getTechnicianBookings)

router.patch('/:id/status', verifyToken, verifyTechnician, updateStatus)
//   PATCH /api/bookings/:id/status   (verifyToken, verifyTechnician)
//
// NOTE: a bare GET "/" was removed on purpose — it had no middleware and
// would have exposed every booking to anyone. The full admin list will live
// at GET /api/admin/bookings later.

export default router;
