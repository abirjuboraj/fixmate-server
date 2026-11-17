/**
 * Generic validator for checkout session creation requests.
 * Ensures required fields exist before passing to services.
 *
 * @param {import('express').Request} req
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export const validateCreateCheckoutSession = (req) => {
  const errors = [];
  const { customerEmail, mode, items } = req.body || {};

  if (!customerEmail) {
    errors.push('customerEmail is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    errors.push('customerEmail must be a valid email address.');
  }

  if (!mode || !['payment', 'subscription'].includes(mode)) {
    errors.push("mode is required and must be either 'payment' or 'subscription'.");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('items must be a non-empty array of items to purchase.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
