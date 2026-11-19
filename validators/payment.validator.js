/**
 * Validates the request body for creating a Stripe checkout session.
 *
 * We only need a bookingId from the client. Everything else (amount,
 * customer info, service title, etc.) is fetched from the database inside
 * the controller — so we never trust the client to send sensitive data.
 *
 * @param {import('express').Request} req
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export const validateCreateCheckoutSession = (req) => {
  // Collect any validation problems in this array
  const errors = [];

  // Pull bookingId out of the request body
  const { bookingId } = req.body || {};

  // bookingId is required
  if (!bookingId) {
    errors.push("bookingId is required.");
  } else if (typeof bookingId !== "string" || bookingId.trim() === "") {
    // It must be a non-empty string (MongoDB ObjectId arrives as a string)
    errors.push("bookingId must be a non-empty string.");
  }

  // Return whether validation passed and the list of error messages
  return {
    isValid: errors.length === 0,
    errors,
  };
};
