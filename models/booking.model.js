import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const bookingsCollection = () => {
  return getDB().collection("bookings");
};

/**
 *
 * @param {object} doc
 * @returns {Promise<object>}
 */
export const insertBooking = async (doc) => {
  const result = await bookingsCollection().insertOne(doc);

  return {
    _id: result.insertedId,
    ...doc,
  };
};

/**
 *
 * @param {string} serviceId - service._id as string
 * @param {string} customerEmail - logged-in customer's email
 * @returns {Promise<object|null>} An existing active booking, or null
 */
export const findActiveBooking = async (serviceId, customerEmail) => {
  return await bookingsCollection().findOne({
    serviceId: String(serviceId),
    customerEmail,
    status: { $in: ["requested", "accepted", "in-progress"] },
  });
};

/**
 * @param {string} customerEmail
 * @returns {Promise<Array<object>>}
 */
export const findBookingsByCustomer = async (customerEmail) => {
  return await bookingsCollection()
    .find({ customerEmail })
    .sort({ createdAt: -1 })
    .toArray();
};

/**
 * @param {string} bookingId
 * @param {string} customerEmail
 * @returns {Promise<object|null>}
 */
export const findBookingByCustomer = async (bookingId, customerEmail) => {
  return bookingsCollection().findOne({
    _id: new ObjectId(bookingId),
    customerEmail,
  });
};

/**
 *
 * @param {string} bookingId
 * @param {string} customerEmail
 */

export const cancelBookingByCustomer = async (bookingId, customerEmail) => {
  return await bookingsCollection().updateOne(
    {
      _id: new ObjectId(bookingId),
      customerEmail,
      status: "requested",
    },
    {
      $set: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );
};

/**
 * @param {string} technicianEmail
 * @returns {Promise<Array<object>>}
 */

export const findBookingsByTechnician = async (technicianEmail) => {
  return await bookingsCollection()
    .find({
      technicianEmail,
    })
    .sort({ createdAt: -1 })
    .toArray();
};

/**
 *
 * @param {string} bookingId
 * @param {string} technicianEmail
 * @return {Promise<Object | null>}
 */

export const findBookingByTechnician = async (bookingId, technicianEmail) => {
  return await bookingsCollection().findOne({
    _id: new ObjectId(bookingId),
    technicianEmail,
  });
};

/**
 *
 * @param {string} bookingId
 * @param {string} technicianEmail
 * @param {string} currentStatus
 * @param {string} newStatus
 * @param {number} finalAmount
 * @return {Promise<object | null>}
 */

export const updateBookingStatusByTechnician = async (
  bookingId,
  technicianEmail,
  currentStatus,
  newStatus,
  finalAmount,
) => {
  const updateFields = {
    status: newStatus,
    updateAt: new Date(),
  };

  if (newStatus === "completed") {
    updateFields.finalAmount = finalAmount;
  }

  return bookingsCollection().findOneAndUpdate(
    {
      _id: new ObjectId(bookingId),
      technicianEmail,
      status: currentStatus,
    },
    {
      $set: updateFields,
    },
    {
      returnDocument: "after",
    },
  );
};

/**
 * Updates a booking's payment status to 'paid'.
 * Called after successful Stripe checkout.
 *
 * @param {string} bookingId
 * @returns {Promise<object|null>}
 */
export const markBookingAsPaid = async (bookingId) => {
  return await bookingsCollection().findOneAndUpdate(
    { _id: new ObjectId(bookingId) },
    {
      $set: {
        paymentStatus: "paid",
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
};

// admin all bookings get

/**
 * @param {string} query
 * @return {Promise<Array<object>>}
 */

export const getAllBookings = async (query) => {
  return await bookingsCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
};
