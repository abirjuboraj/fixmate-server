import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import {
  getAllServicesForAdmin,
  updateServiceApproval,
} from "../controllers/services.controller.js";

const router = Router();


router.get("/", verifyToken, verifyAdmin, getAllServicesForAdmin);

router.patch("/:id/approval", verifyToken, verifyAdmin, updateServiceApproval);

export default router;
