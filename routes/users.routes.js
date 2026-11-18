import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { getAllUsers, updateUserRole } from "../controllers/users.controller.js";

const router = Router();

router.get("/", verifyToken, verifyAdmin, getAllUsers);


router.patch('/:id/role', verifyToken, verifyAdmin, updateUserRole);

export default router;
