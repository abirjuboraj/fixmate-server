import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { findServiceById } from "../models/services.model.js";
import {
  insertBooking,
  findActiveBooking,
  findBookingsByCustomer,
} from "../models/booking.model.js";

/**
 * @param {import('express').Request} req
 * @returns {{ name: string, email: string }}
 */
const requireCustomerIdentity = (req) => {
  if (!req.user || !req.user.email) {
    throw new ApiError(401, "Unauthorized");
  }

  return { name: req.user.name || "Customer", email: req.user.email };
};

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const createBooking = asyncHandler(async (req, res) => {
  const customer = requireCustomerIdentity(req);

  const { serviceId, customerPhone, address, preferredDate, problemDescription } =
    req.body;

  if (!serviceId) {
    throw new ApiError(400, "serviceId is required.");
  }

  if (!customerPhone || !address || !preferredDate || !problemDescription) {
    throw new ApiError(
      400,
      "Phone, address, preferred date and problem description are all required."
    );
  }

  const description = String(problemDescription).trim();

  if (description.length < 20) {
    throw new ApiError(
      400,
      "Problem description must be at least 20 characters."
    );
  }

  const todayString = toDateString(new Date());

  if (String(preferredDate) < todayString) {
    throw new ApiError(400, "Preferred date must be today or a future date.");
  }

  const service = await findServiceById(serviceId);

  if (
    !service ||
    service.approvalStatus !== "approved" ||
    service.isAvailable !== true
  ) {
    throw new ApiError(404, "Service not found or no longer available.");
  }

  if (service.technicianEmail === customer.email) {
    throw new ApiError(403, "You cannot request your own service.");
  }

  const existingActive = await findActiveBooking(serviceId, customer.email);

  if (existingActive) {
    throw new ApiError(
      409,
      "You already have an active request for this service."
    );
  }

  const now = new Date();

  const booking = {
    
    serviceId: String(service._id),
    serviceTitle: service.title,
    serviceImage: service.image,
    category: service.category,
    basePrice: service.basePrice,
    technicianName: service.technicianName,
    technicianEmail: service.technicianEmail,


    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: String(customerPhone).trim(),
    address: String(address).trim(),
    preferredDate: new Date(preferredDate),
    problemDescription: description,

    status: "requested",
    finalAmount: service.basePrice, 
    paymentStatus: "unpaid",

    createdAt: now,
    updatedAt: now,
  };

  const created = await insertBooking(booking);

  return res.status(201).json({
    success: true,
    message: "Repair request sent successfully!",
    data: created,
  });
});

/**
 * TODO (you): GET /api/bookings/my — the logged-in customer's bookings,
 * for the My Bookings dashboard page.
 *
 * Steps to implement (the model helper is stubbed in models/booking.model.js):
 *   1. const customer = requireCustomerIdentity(req);   // email from req.user
 *   2. const bookings = await findBookingsByCustomer(customer.email);
 *   3. return res.status(200).json({
 *        success: true,
 *        message: 'Your bookings fetched successfully',
 *        data: bookings,
 *      });
 *
 * The route (booking.routes.js) and the frontend fetch handler
 * (lib/api/bookings.ts -> getMyBookings) are already wired — until you
 * finish this, the My Bookings page will simply show its empty state.
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  // TODO (you): implement the 3 steps shown above.
  return res.status(200).json({
    success: true,
    message: "Bookings API not implemented yet.",
    data: [],
  });
});

export default {
  createBooking,
  getMyBookings,
};
