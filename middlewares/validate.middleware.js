import ApiError from '../utils/ApiError.js';

/**
 * Higher-order middleware function to run validation schemas against the request.
 * Can validate body, query, or params.
 *
 * @param {Function} validatorFn - Function accepting (req) and returning { isValid, errors }
 */
export const validate = (validatorFn) => {
  return (req, res, next) => {
    const { isValid, errors } = validatorFn(req);
    if (!isValid) {
      return next(new ApiError(400, 'Validation Failed', errors));
    }
    next();
  };
};

export default validate;
