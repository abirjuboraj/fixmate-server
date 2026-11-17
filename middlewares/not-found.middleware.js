import ApiError from '../utils/ApiError.js';

/**
 * 404 Not Found Middleware
 * Catches all unmatched requests and forwards an ApiError to the centralized error handler.
 */
export const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFoundMiddleware;
