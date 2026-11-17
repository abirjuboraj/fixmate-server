/**
 * Wraps asynchronous controller/middleware functions to forward unhandled promise rejections
 * to the centralized error-handling middleware via next(error).
 *
 * @param {Function} requestHandler - Asynchronous Express route handler or middleware
 * @returns {Function} Express middleware function
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export default asyncHandler;
