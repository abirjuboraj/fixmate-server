import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import ApiError from '../utils/ApiError.js';


const getSessionsCollection = () => getDB().collection('session');
const getUsersCollection = () => getDB().collection('user');


const resolveUserFromToken = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  const session = await getSessionsCollection().findOne({ token });

  if (!session) {
    return null;
  }

  const userId = session.userId;

  const isObjectId = /^[a-f\d]{24}$/i.test(userId);

  if (!isObjectId) {
    return null;
  }

  return await getUsersCollection().findOne({ _id: new ObjectId(String(userId)) });
};


export const verifyToken = async (req, res, next) => {
  try {
    const user = await resolveUserFromToken(req);

    if (!user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
};


export const optionalAuth = async (req, res, next) => {
  try {
    const user = await resolveUserFromToken(req);

    if (user) {
      req.user = user;
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Role guards — run AFTER verifyToken (they trust req.user.role).
 * Wrong role -> 403 Forbidden.
 * @param {string} role - 'customer' | 'technician' | 'admin'
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return next(new ApiError(403, 'Forbidden'));
    }

    return next();
  };
};

export const verifyTechnician = requireRole('technician');
export const verifyCustomer = requireRole('customer');
export const verifyAdmin = requireRole('admin');

export default {
  verifyToken,
  optionalAuth,
  verifyCustomer,
  verifyTechnician,
  verifyAdmin
};
