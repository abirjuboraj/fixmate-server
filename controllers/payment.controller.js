import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { getStripeInstance } from "../config/stripe.js";
import {
  findBookingByCustomer,
  markBookingAsPaid,
} from "../models/booking.model.js";
import {
  insertPayment,
  findPaymentBySessionId,
  findPaymentsByCustomer,
  getAllTransactions,
  getTotalRevenue,
} from "../models/payment.model.js";

/**
 * Helper to ensure the requesting user is a customer
 */
const requireCustomerIdentity = (req) => {
  if (!req.user || !req.user.email) {
    throw new ApiError(401, "Unauthorized");
  }
  return { name: req.user.name || "Customer", email: req.user.email };
};

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const customer = requireCustomerIdentity(req);
  const { bookingId } = req.body;

  if (!bookingId) {
    throw new ApiError(400, "bookingId is required.");
  }

  // 1. Fetch booking to verify ownership and pricing
  const booking = await findBookingByCustomer(bookingId, customer.email);

  if (!booking) {
    throw new ApiError(404, "Booking not found or you do not have permission.");
  }

  // 2. Validation: only 'completed' bookings can be paid
  if (booking.status !== "completed") {
    throw new ApiError(
      400,
      `Cannot pay for a booking that is currently "${booking.status}". Only completed jobs can be paid.`,
    );
  }

  // 3. Validation: prevent double payment
  if (booking.paymentStatus === "paid") {
    throw new ApiError(400, "This booking has already been paid.");
  }

  // 4. Calculate amount in cents (USD)
  const amountToCharge =
    booking.finalAmount !== undefined ? booking.finalAmount : booking.basePrice;

  if (!amountToCharge || amountToCharge <= 0) {
    throw new ApiError(400, "Invalid payable amount for this booking.");
  }

  const unitAmountInCents = Math.round(amountToCharge * 100);

  // 5. Build return URLs
  const clientBase =
    process.env.CLIENT_ORIGIN?.split(",")[0]?.trim() || "http://localhost:3000";

  const successUrl = `${clientBase}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${clientBase}/payment/cancel?booking_id=${bookingId}`;

  // 6. Create Stripe Checkout Session
  const stripe = getStripeInstance();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: customer.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: booking.serviceTitle,
            description: `FixMate repair service by ${booking.technicianName} (${booking.category})`,
            images: booking.serviceImage ? [booking.serviceImage] : [],
          },
          unit_amount: unitAmountInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: String(booking._id),
      serviceTitle: booking.serviceTitle,
      customerName: customer.name,
      customerEmail: customer.email,
      technicianName: booking.technicianName,
      technicianEmail: booking.technicianEmail,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return res.status(200).json({
    success: true,
    message: "Stripe checkout session created successfully.",
    data: {
      url: session.url,
      sessionId: session.id,
    },
  });
});

export const verifyCheckoutSession = asyncHandler(async (req, res) => {
  const customer = requireCustomerIdentity(req);
  const { session_id } = req.query;

  if (!session_id) {
    throw new ApiError(400, "session_id query parameter is required.");
  }

  const stripe = getStripeInstance();

  // 1. Retrieve session details directly from Stripe API
  const session = await stripe.checkout.sessions.retrieve(String(session_id));

  if (!session) {
    throw new ApiError(404, "Stripe session not found.");
  }

  // Verify that customer is the one who paid
  if (
    session.customer_email &&
    session.customer_email.toLowerCase() !== customer.email.toLowerCase()
  ) {
    throw new ApiError(403, "You do not have permission to view this payment.");
  }

  // 2. Check payment status from Stripe
  if (session.payment_status !== "paid") {
    return res.status(200).json({
      success: false,
      message: "Payment has not been completed yet.",
      data: {
        paid: false,
        status: session.payment_status,
      },
    });
  }

  // 3. Prevent duplicate payment documents (idempotency check)
  const existingPayment = await findPaymentBySessionId(session.id);
  if (existingPayment) {
    return res.status(200).json({
      success: true,
      message: "Payment already verified and recorded.",
      data: {
        paid: true,
        payment: existingPayment,
      },
    });
  }

  // 4. Extract metadata attached when session was created
  const metadata = session.metadata || {};
  const bookingId = metadata.bookingId;

  if (!bookingId) {
    throw new ApiError(400, "Session metadata is missing bookingId.");
  }

  // 5. Update the booking document in database: paymentStatus -> 'paid'
  await markBookingAsPaid(bookingId);

  // 6. Save payment in payments collection matching Requirement Schema (Page 5):
  const paymentRecord = {
    bookingId: String(bookingId),
    serviceTitle: metadata.serviceTitle || "Repair Service",
    customerName: metadata.customerName || customer.name,
    customerEmail: metadata.customerEmail || customer.email,
    technicianName: metadata.technicianName || "Technician",
    technicianEmail: metadata.technicianEmail || "",
    amount: (session.amount_total || 0) / 100, // convert cents to dollars
    currency: session.currency || "usd",
    transactionId: String(session.payment_intent || session.id),
    stripeSessionId: session.id,
    paymentStatus: "paid",
    paidAt: new Date(),
  };

  const savedPayment = await insertPayment(paymentRecord);

  return res.status(200).json({
    success: true,
    message: "Payment successfully verified and saved!",
    data: {
      paid: true,
      payment: savedPayment,
    },
  });
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const customer = requireCustomerIdentity(req);
  const payments = await findPaymentsByCustomer(customer.email);

  return res.status(200).json({
    success: true,
    message: "Payment history fetched successfully.",
    data: payments,
  });
});

export const getTransactionsForAdmin = asyncHandler(async (req, res) => {
  const [transactions, totalRevenue] = await Promise.all([
    getAllTransactions(),
    getTotalRevenue(),
  ]);

  res.status(200).json({
    success: true,
    message: "Transactions fetched successfully",
    data: {
      transactions,
      totalRevenue,
    },
  });
});

export default {
  createCheckoutSession,
  verifyCheckoutSession,
  getMyPayments,
};
