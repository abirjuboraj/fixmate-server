class ApiError extends Error {
  /**
   * Custom ApiError for standardized error handling.
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error description message
   * @param {Array} errors - Optional validation or contextual error details
   * @param {string} stack - Optional custom stack trace
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
