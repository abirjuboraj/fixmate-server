import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import {
  getAllServicesForAdmin,
} from "../controllers/services.controller.js";

const router = Router();


router.get("/", verifyToken, verifyAdmin, getAllServicesForAdmin);

// PATCH /api/admin/services/:id/approval — approve or reject a service.
// Body: { approvalStatus: "approved" | "rejected" }. Admin only.
// router.patch("/:id/approval", verifyToken, verifyAdmin, updateServiceApproval);

export default router;
