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

/**
 * @param {{ search?: string, role?: string, category?: string }} options
 * @returns {Promise<Array<object>>}
 */
export const findAllUsers = async ({ search, role, category } = {}) => {
  const filter = {};

  // 1. Search by name or email
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }];
  }

  // 2. Filter by role
  if (role && ["customer", "technician", "admin"].includes(role)) {
    filter.role = role;
  }

  // 3. Filter technicians by the category of services they offer
  if (category) {
    const servicesCollection = getDB().collection("services");
    // Step A: find services in this category, collect their technician emails
    const matchingServices = await servicesCollection
      .find({ category }, { projection: { technicianEmail: 1 } })
      .toArray();

    const technicianEmails = [
      ...new Set(matchingServices.map((s) => s.technicianEmail)),
    ];

    // Step B: keep only users who are one of those technicians
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
    .sort({ createdAt: -1 }) // newest users first
    .toArray();
};
