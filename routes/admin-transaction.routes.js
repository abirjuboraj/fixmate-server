import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { getTransactionsForAdmin } from "../controllers/payment.controller.js";

const router = Router();

router.get('/',verifyToken, verifyAdmin, getTransactionsForAdmin)


export default router;