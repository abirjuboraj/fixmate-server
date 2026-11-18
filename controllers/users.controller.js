import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { findAllUsers, findUserById, updateUserRoleById, updateUserProfileById } from "../models/users.model.js";


/**
 *
 * @param {import('express').Request} req
 * @returns {{ name: string, email: string }}
 */
const requireAdminIdentity = (req) => {
  if (!req.user || !req.user.email) {
    throw new ApiError(401, 'Unauthorized');
  }

  return { name: req.user.name || 'Admin', email: req.user.email };
};

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


export const updateUserRole = asyncHandler(async (req, res) => {
  const admin = requireAdminIdentity(req);
  const { id } = req.params;
  const { role } = req.body;


  if (!["customer", "technician", "admin"].includes(role)) {
    throw new ApiError(400, "role must be customer, technician or admin.");
  }

  
  if (admin.email) {
    const target = await findUserById(id); 
    if (!target) throw new ApiError(404, "User not found.");
    if (target.email === admin.email) {
      throw new ApiError(400, "You cannot change your own role.");
    }
  }

  const updated = await updateUserRoleById(id, role);
  if (!updated) throw new ApiError(404, "User not found.");

  return res.status(200).json({
    success: true,
    message: `User role updated to ${role}.`,
    data: updated,
  });
});


//update user profile

export const updateUserProfile = asyncHandler(async(req, res)=>{
  const userId = req.user._id;

  const {name, image, bio, phone, area} = req.body;

  const updatedData = {
    name,
    image,
    bio,
    area,
    phone,
    updatedAt: new Date(),
  }

  const updatedUser = await updateUserProfileById(userId,updatedData);

  return res.status(200).json({
    success: true,
    message: 'User profile updated successfully',
    data: updatedUser,
  })


})
