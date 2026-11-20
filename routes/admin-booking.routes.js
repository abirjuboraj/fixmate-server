import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { getAllBookingsForAdmin } from "../controllers/bookings.controller.js";


const router = Router();



router.get('/', verifyToken, verifyAdmin, getAllBookingsForAdmin)



export default router