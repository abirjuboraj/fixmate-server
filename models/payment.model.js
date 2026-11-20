import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const paymentsCollection = () => {
  return getDB().collection("payments");
};


export const insertPayment = async (paymentData) => {
  const now = new Date();
  const doc = {
    ...paymentData,
    paidAt: paymentData.paidAt || now,
    createdAt: now,
  };

  const result = await paymentsCollection().insertOne(doc);
  return {
    _id: result.insertedId,
    ...doc,
  };
};

/**
 * Finds a payment record by Stripe Checkout Session ID.
 * Used to check if this payment was already processed (prevents duplicates).
 */
export const findPaymentBySessionId = async (stripeSessionId) => {
  return await paymentsCollection().findOne({ stripeSessionId });
};

/**
 * Finds all payments for a specific customer email.
 */
export const findPaymentsByCustomer = async (customerEmail) => {
  return await paymentsCollection()
    .find({ customerEmail })
    .sort({ paidAt: -1 })
    .toArray();
};

/**
 * Finds all payments for admin oversight.
 */
export const getAllTransactions = async () => {
  return await paymentsCollection()
    .find({})
    .sort({ paidAt: -1 })
    .toArray();
};

// calculate total revenue for admin panel
export const getTotalRevenue = async() => {
  const result = await paymentsCollection().aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$amount",
        },
      },
    },
  ]).toArray();

  return result[0]?.totalRevenue || 0;
}

export default {
  insertPayment,
  findPaymentBySessionId,
  findPaymentsByCustomer,
  getAllTransactions,
};
