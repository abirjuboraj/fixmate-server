import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {
  insertService,
  findPublicServices,
  findServicesByTechnician,
  findServiceById,
  updateServiceById,
  deleteServiceById
} from '../models/services.model.js';

/**
 *
 * @param {import('express').Request} req
 * @returns {{ name: string, email: string }}
 */
const requireTechnicianIdentity = (req) => {
  if (!req.user || !req.user.email) {
    throw new ApiError(401, 'Unauthorized');
  }

  return { name: req.user.name || 'Technician', email: req.user.email };
};


const pickEditableFields = (body = {}) => {
  const fields = {};

  if (body.title !== undefined) fields.title = String(body.title).trim();
  if (body.category !== undefined) fields.category = body.category;
  if (body.description !== undefined) fields.description = String(body.description).trim();
  if (body.image !== undefined) fields.image = String(body.image).trim();
  if (body.basePrice !== undefined) fields.basePrice = Number(body.basePrice);
  if (body.estimatedDuration !== undefined) {
    fields.estimatedDuration = String(body.estimatedDuration).trim();
  }
  if (body.serviceMode !== undefined) fields.serviceMode = body.serviceMode;
  if (body.serviceArea !== undefined) fields.serviceArea = String(body.serviceArea).trim();

  return fields;
};


export const addService = asyncHandler(async (req, res) => {
  const technician = requireTechnicianIdentity(req);
  const payload = pickEditableFields(req.body);

  const service = await insertService(payload, technician);

  return res.status(201).json({
    success: true,
    message: 'Service created. It is pending admin approval.',
    data: service
  });
});

/**
 * Controller to browse services (Public).
 * Only approvalStatus 'approved' and isAvailable true are returned.
 * Server-side search (title/category), filters (category, serviceMode)
 * and sorting (price-asc, price-desc, newest) via query params.
 */
export const getAllServices = asyncHandler(async (req, res) => {
  const { search, category, serviceMode, sort, limit } = req.query;

  const services = await findPublicServices({
    search,
    category,
    serviceMode,
    sort,
    limit
  });

  return res.status(200).json({
    success: true,
    message: 'Services fetched successfully',
    data: services
  });
});

/**
 * Controller to fetch the logged-in technician's own services (all approval states),
 * for the My Services dashboard.
 */
export const getMyServices = asyncHandler(async (req, res) => {
  const technician = requireTechnicianIdentity(req);

  const services = await findServicesByTechnician(technician.email);

  return res.status(200).json({
    success: true,
    message: 'Your services fetched successfully',
    data: services
  });
});

/**
 * Controller to fetch a single service by ID (Public).
 * Hidden services (pending/rejected/unavailable) are only visible to their owner.
 */
export const getSingleService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await findServiceById(id);

  if (!service) {
    throw new ApiError(404, 'Service not found.');
  }

  const isOwner = Boolean(req.user?.email) && service.technicianEmail === req.user.email;
  const isPubliclyVisible =
    service.approvalStatus === 'approved' && service.isAvailable === true;

  if (!isPubliclyVisible && !isOwner) {
    throw new ApiError(404, 'Service not found.');
  }

  return res.status(200).json({
    success: true,
    message: 'Service fetched successfully',
    data: service
  });
});

/**
 * Controller to update a service (owner technician only).
 * Any edit resets approvalStatus back to 'pending' for admin re-review.
 */
export const updateService = asyncHandler(async (req, res) => {
  const technician = requireTechnicianIdentity(req);
  const { id } = req.params;

  const existing = await findServiceById(id);

  if (!existing) {
    throw new ApiError(404, 'Service not found.');
  }

  if (existing.technicianEmail !== technician.email) {
    throw new ApiError(403, 'Forbidden: You can only update your own services.');
  }

  const updates = pickEditableFields(req.body);
  const updated = await updateServiceById(id, updates, technician.email);

  return res.status(200).json({
    success: true,
    message: 'Service updated. It is pending admin re-approval.',
    data: updated
  });
});

/**
 * Controller to delete a service (owner technician only).
 */
export const deleteService = asyncHandler(async (req, res) => {
  const technician = requireTechnicianIdentity(req);
  const { id } = req.params;

  const existing = await findServiceById(id);

  if (!existing) {
    throw new ApiError(404, 'Service not found.');
  }

  if (existing.technicianEmail !== technician.email) {
    throw new ApiError(403, 'Forbidden: You can only delete your own services.');
  }

  const deleted = await deleteServiceById(id, technician.email);

  return res.status(200).json({
    success: true,
    message: 'Service deleted successfully',
    data: { deleted }
  });
});

export default {
  addService,
  getAllServices,
  getMyServices,
  getSingleService,
  updateService,
  deleteService
};
