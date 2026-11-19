import { Router } from "express";
import { verifyToken, verifyCustomer } from "../middlewares/auth.middleware.js";
import { createBooking, getMyBookings } from "../controllers/bookings.controller.js";

const router = Router();

// POST /api/bookings — a customer sends a repair request (status: 'requested')
router.post("/", verifyToken, verifyCustomer, createBooking);

// GET /api/bookings/my — the logged-in customer's own bookings.
// Controller is a TODO stub for now; the frontend already calls it.
router.get("/my", verifyToken, verifyCustomer, getMyBookings);

// TODO (you) — coming in later steps (Challenge 2/3):
//   PATCH /api/bookings/:id/cancel   (verifyToken, verifyCustomer)
//   GET /api/bookings/technician     (verifyToken, verifyTechnician)
//   PATCH /api/bookings/:id/status   (verifyToken, verifyTechnician)
//
// NOTE: a bare GET "/" was removed on purpose — it had no middleware and
// would have exposed every booking to anyone. The full admin list will live
// at GET /api/admin/bookings later.

export default router;
