import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { findAllUsers } from "../models/users.model.js";

/**
 * Controller: GET /api/admin/users (Admin only)
 * Query params (all optional): ?search=&role=&category=
 * Used by the Manage Users table with search + filters.
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, category } = req.query;

  const users = await findAllUsers({
    search: search ? String(search).trim() : undefined,
    role: role ? String(role) : undefined,
    category: category ? String(category) : undefined,
  });

  return res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: users,
  });
});

// ============================================================================
// TODO (you): Admin changes a user's role — PATCH /api/admin/users/:id/role
// ============================================================================
// This is required by the assignment: "Admin can change a user's role
// (customer / technician / admin) using the protected Express admin API.
// The admin cannot change their own role."
//
// 1. models/users.model.js — add:
//
//    export const updateUserRoleById = async (userId, newRole) => {
//      const objectId = toObjectId(userId);   // reuse the toObjectId helper pattern
//      if (!objectId) return null;            // from services.model.js
//
//      return await usersCollection().findOneAndUpdate(
//        { _id: objectId },
//        { $set: { role: newRole, updatedAt: new Date() } },
//        { returnDocument: "after" }
//      );
//    };
//
// 2. controllers/users.controller.js — add:
//
//    export const updateUserRole = asyncHandler(async (req, res) => {
//      const admin = requireAdminIdentity(req);        // the logged-in admin
//      const { id } = req.params;
//      const { role } = req.body;
//
//      // validate the new role
//      if (!["customer", "technician", "admin"].includes(role)) {
//        throw new ApiError(400, "role must be customer, technician or admin.");
//      }
//
//      // RULE: the admin cannot change their own role
//      if (admin.email) {
//        const target = await findUserById(id);        // small helper: findOne by _id
//        if (!target) throw new ApiError(404, "User not found.");
//        if (target.email === admin.email) {
//          throw new ApiError(400, "You cannot change your own role.");
//        }
//      }
//
//      const updated = await updateUserRoleById(id, role);
//      if (!updated) throw new ApiError(404, "User not found.");
//
//      return res.status(200).json({
//        success: true,
//        message: `User role updated to ${role}.`,
//        data: updated,
//      });
//    });
//
// 3. routes/users.routes.js — register (BEFORE any route that could shadow it):
//
//    router.patch("/:id/role", verifyToken, verifyAdmin, updateUserRole);
//
// The frontend is already wired: it calls PATCH /api/admin/users/:id/role
// with body { role } and expects { success, message, data } — the moment your
// endpoint exists, the UI works with no further changes.
// ============================================================================
