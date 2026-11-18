import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { getAllUsers } from "../controllers/users.controller.js";

const router = Router();

router.get("/", verifyToken, verifyAdmin, getAllUsers);

// TODO (you): PATCH /api/admin/users/:id/role — change a user's role
// See the full step-by-step TODO in controllers/users.controller.js, then add:
//   router.patch("/:id/role", verifyToken, verifyAdmin, updateUserRole);
// (import updateUserRole from "../controllers/users.controller.js" at the top)

export default router;
