import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { findServiceById } from "../models/services.model.js";
import {
  insertBooking,
  findActiveBooking,
  findBookingsByCustomer,
  cancelBookingByCustomer,
  findBookingByCustomer,
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

//customer booking create api

export const createBooking = asyncHandler(async (req, res) => {
  const customer = requireCustomerIdentity(req);

  const {
    serviceId,
    customerPhone,
    address,
    preferredDate,
    problemDescription,
  } = req.body;

  if (!serviceId) {
    throw new ApiError(400, "serviceId is required.");
  }

  if (!customerPhone || !address || !preferredDate || !problemDescription) {
    throw new ApiError(
      400,
      "Phone, address, preferred date and problem description are all required.",
    );
  }

  const description = String(problemDescription).trim();

  if (description.length < 20) {
    throw new ApiError(
      400,
      "Problem description must be at least 20 characters.",
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
      "You already have an active request for this service.",
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

// customer get bookings api
export const getMyBookings = asyncHandler(async (req, res) => {
  const customer = requireCustomerIdentity(req);
  const bookings = await findBookingsByCustomer(customer.email);

  return res.status(200).json({
    success: true,
    message: "Your bookings fetched successfully",
    data: bookings,
  });
});

// customer booking cancel
export const cancelBooking = asyncHandler(async (req, res) => {
  const customer = requireCustomerIdentity(req);

  const bookingId = req.params.id;

  const booking = await findBookingByCustomer(bookingId, customer.email);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  if (booking.status !== "requested") {
    return res.status(400).json({
      success: false,
      message: "Only requested bookings can be cancelled",
    });
  }

  const cancelled = await cancelBookingByCustomer(booking._id, customer.email);

  return res.status(200).json({
    success: true,
    message: "Your booking has been cancelled",
    data: cancelled,
  });
});

export default {
  createBooking,
  getMyBookings,
  cancelBooking,
};
