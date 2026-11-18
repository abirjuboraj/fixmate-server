import { Router } from "express";
import { updateUserProfile } from "../controllers/users.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.patch('/profile', verifyToken, updateUserProfile);

export default router;