import { Router } from "express";
import { verifyToken, verifyCustomer, verifyTechnician, verifyAdmin } from "../middlewares/auth.middleware.js";
import { cancelBooking, createBooking, getMyBookings, getTechnicianBookings, updateStatus } from "../controllers/bookings.controller.js";

const router = Router();

router.post("/", verifyToken, verifyCustomer, createBooking);

router.get("/own", verifyToken, verifyCustomer, getMyBookings);

router.patch('/:id/cancel', verifyToken, verifyCustomer, cancelBooking);

router.get('/technician', verifyToken, verifyTechnician, getTechnicianBookings)

router.patch('/:id/status', verifyToken, verifyTechnician, updateStatus)


export default router;
