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
 * Business rule: a customer cannot have two ACTIVE requests for the same
 * service at the same time. "Active" = requested, accepted or in-progress.
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
 * TODO (you): GET /api/bookings/my — all bookings of the logged-in customer,
 * newest first, for the My Bookings dashboard page.
 *
 * When you implement it, replace the empty return below with:
 *
 *   return await bookingsCollection()
 *     .find({ customerEmail })
 *     .sort({ createdAt: -1 })
 *     .toArray();
 *
 * The controller (getMyBookings) and the frontend fetch handler
 * (lib/api/bookings.ts -> getMyBookings) are already wired up.
 *
 * @param {string} customerEmail
 * @returns {Promise<Array<object>>}
 */
export const findBookingsByCustomer = async (customerEmail) => {
  // TODO (you): implement the query shown above.
  return [];
};
