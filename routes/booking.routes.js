import { Router } from "express";
import { verifyToken, verifyCustomer } from "../middlewares/auth.middleware.js";
import { cancelBooking, createBooking, getMyBookings } from "../controllers/bookings.controller.js";

const router = Router();

router.post("/", verifyToken, verifyCustomer, createBooking);

router.get("/own", verifyToken, verifyCustomer, getMyBookings);

router.patch('/:id/cancel', verifyToken, verifyCustomer, cancelBooking)

//   PATCH /api/bookings/:id/cancel   (verifyToken, verifyCustomer)
//   GET /api/bookings/technician     (verifyToken, verifyTechnician)
//   PATCH /api/bookings/:id/status   (verifyToken, verifyTechnician)
//
// NOTE: a bare GET "/" was removed on purpose — it had no middleware and
// would have exposed every booking to anyone. The full admin list will live
// at GET /api/admin/bookings later.

export default router;
