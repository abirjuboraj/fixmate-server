import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const usersCollection = () => {
  return getDB().collection("user");
};

/**
 * Escapes user input before using it in a $regex, so special characters
 * like "(" or "+" cannot break the query.
 */
const escapeRegex = (text) => {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const toObjectId = (serviceId) => {
  try {
    return new ObjectId(serviceId);
  } catch {
    return null;
  }
};

/**
 * @param {{ search?: string, role?: string, category?: string }} options
 * @returns {Promise<Array<object>>}
 */
export const findAllUsers = async ({ search, role, category } = {}) => {
  const filter = {};

  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }];
  }

  if (role && ["customer", "technician", "admin"].includes(role)) {
    filter.role = role;
  }

  if (category) {
    const servicesCollection = getDB().collection("services");

    const matchingServices = await servicesCollection
      .find({ category }, { projection: { technicianEmail: 1 } })
      .toArray();

    const technicianEmails = [
      ...new Set(matchingServices.map((s) => s.technicianEmail)),
    ];

    filter.email = { $in: technicianEmails };
    filter.role = "technician";
  }

  return await usersCollection()
    .find(filter, {
      projection: {
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
        role: 1,
        phone: 1,
        createdAt: 1,
      },
    })
    .sort({ createdAt: -1 })
    .toArray();
};

export const findUserById = async (id) => {
  const objectId = toObjectId(id);

  // Invalid id string (not a valid ObjectId) -> treat as "not found"
  if (!objectId) return null;

  // NOTE: must be .findOne() (with await) — .find() returns a cursor object,
  // which is always truthy and has no email property. That silently broke
  // the "admin cannot change own role" check in the controller.
  return await usersCollection().findOne({ _id: objectId });
};

/**
 * @param {{ userId: string, newRole: string }}
 *
 */
export const updateUserRoleById = async (userId, newRole) => {
  const objectId = toObjectId(userId);
  if (!objectId) return null;

  return await usersCollection().findOneAndUpdate(
    { _id: objectId },
    { $set: { role: newRole, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
};
