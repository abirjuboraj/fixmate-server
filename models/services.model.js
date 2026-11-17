import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// FixMate service enums (from the requirement data design)
export const SERVICE_CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "AC",
  "Refrigerator",
  "TV",
  "Washing Machine",
  "Electrical",
];

export const SERVICE_MODES = ["Home Visit", "Shop Drop-off"];

const servicesCollection = () => {
  return getDB().collection("services");
};

/**
 * Converts an ID string to an ObjectId, or null when the string is not a
 * valid ObjectId. Callers treat null as "not found" instead of crashing
 * with a driver cast error (formal validation will be added later).
 */
const toObjectId = (serviceId) => {
  try {
    return new ObjectId(serviceId);
  } catch {
    return null;
  }
};

/**
 * Escapes user input before embedding it into a $regex so special
 * characters (e.g. "(", "+") cannot break the query.
 */
const escapeRegex = (text) => {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Builds a service document. Owner identity and moderation state are always
 * set server-side — the client payload never controls them. The payload is
 * stored as sent; field validation will be added later.
 * @param {object} payload - Fields coming from the frontend form
 * @param {{ name: string, email: string }} technician - From the auth middleware
 * @returns {object}
 */
const buildServiceDocument = (payload, technician) => {
  const now = new Date();

  return {
    ...payload,
    technicianName: technician.name,
    technicianEmail: technician.email,
    approvalStatus: "pending",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * @param {object} payload - Service fields from the frontend
 * @param {{ name: string, email: string }} technician - Logged-in technician from the auth middleware
 * @returns {Promise<object>} The inserted service including its generated _id
 */
export const insertService = async (payload, technician) => {
  const doc = buildServiceDocument(payload, technician);

  const result = await servicesCollection().insertOne(doc);

  return {
    _id: result.insertedId,
    ...doc,
  };
};

/**
 * Public browse query: only approved + available services, with server-side
 * search (title or category), filters (category, serviceMode) and sorting.
 * @param {{ search?: string, category?: string, serviceMode?: string, sort?: string, limit?: number }} options
 * @returns {Promise<Array<object>>}
 */
export const findPublicServices = async ({
  search,
  category,
  serviceMode,
  sort,
  limit,
} = {}) => {
  const filter = {
    approvalStatus: "approved",
    isAvailable: true,
  };

  if (category) {
    filter.category = String(category);
  }

  if (serviceMode) {
    filter.serviceMode = String(serviceMode);
  }

  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ title: rx }, { category: rx }];
  }

  const sortAliases = {
    "price-asc": { basePrice: 1 },
    "price-desc": { basePrice: -1 },
    "low-to-high": { basePrice: 1 },
    "high-to-low": { basePrice: -1 },
    newest: { createdAt: -1 },
    latest: { createdAt: -1 },
  };

  const sortStage = sortAliases[String(sort).toLowerCase()] || {
    createdAt: -1,
  };

  let query = servicesCollection().find(filter).sort(sortStage);

  const parsedLimit = Number.parseInt(limit, 10);

  if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
    query = query.limit(Math.min(parsedLimit, 100));
  }

  return await query.toArray();
};

/**
 * @param {string} technicianEmail
 * @returns {Promise<Array<object>>}
 */
export const findServicesByTechnician = async (technicianEmail) => {
  return await servicesCollection()
    .find({ technicianEmail })
    .sort({ createdAt: -1 })
    .toArray();
};

/**
 * Finds a single service by ID.
 * @param {string} serviceId - 24-character hex ObjectId string
 * @returns {Promise<object|null>}
 */
export const findServiceById = async (serviceId) => {
  const objectId = toObjectId(serviceId);

  if (!objectId) {
    return null;
  }

  return await servicesCollection().findOne({ _id: objectId });
};

/**
 * Updates a service owned by the requesting technician (atomic ownership check).
 * Per requirement: any edit resets approvalStatus back to 'pending' for re-review.
 * @param {string} serviceId
 * @param {object} updates - Sanitized editable fields (partial)
 * @param {string} ownerEmail - technicianEmail of the authenticated owner
 * @returns {Promise<object|null>} The updated document, or null if not found / not owned
 */
export const updateServiceById = async (serviceId, updates, ownerEmail) => {
  const objectId = toObjectId(serviceId);

  if (!objectId) {
    return null;
  }

  return await servicesCollection().findOneAndUpdate(
    { _id: objectId, technicianEmail: ownerEmail },
    {
      $set: {
        ...updates,
        approvalStatus: "pending",
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
};

// update toggle availability

export const updateAvailabilityById = async (
  serviceId,
  isAvailable,
  ownerEmail,
) => {
  const objectId = toObjectId(serviceId);

  if (!objectId) return null;

  return await servicesCollection().findOneAndUpdate(
    { _id: objectId, technicianEmail: ownerEmail },
    {
      $set: { isAvailable, updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
};

/**
 * Deletes a service by ID, only if owned by the given technician (atomic ownership check).
 * @param {string} serviceId
 * @param {string} ownerEmail - technicianEmail of the authenticated owner
 * @returns {Promise<boolean>} true when a document was deleted
 */
export const deleteServiceById = async (serviceId, ownerEmail) => {
  const objectId = toObjectId(serviceId);

  if (!objectId) {
    return false;
  }

  const result = await servicesCollection().deleteOne({
    _id: objectId,
    technicianEmail: ownerEmail,
  });

  return result.deletedCount > 0;
};
