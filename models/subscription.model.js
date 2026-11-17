import { getDB } from '../config/db.js';

const COLLECTION_NAME = 'subscriptions';

/**
 * Access the subscriptions collection.
 * @returns {import('mongodb').Collection}
 */
const getCollection = () => getDB().collection(COLLECTION_NAME);

/**
 * Subscription / Payment Record Data Model
 * Provides reusable MongoDB database access methods for payment lifecycle tracking.
 */
export const SubscriptionModel = {
  /**
   * Find record by Stripe customer ID or session ID
   */
  async findByCustomerId(customerId) {
    return await getCollection().findOne({ customerId });
  },

  /**
   * Find record by Stripe Subscription ID
   */
  async findBySubscriptionId(stripeSubscriptionId) {
    return await getCollection().findOne({ stripeSubscriptionId });
  },

  /**
   * Upsert a subscription or payment record
   */
  async upsert(filter, updateData) {
    return await getCollection().updateOne(
      filter,
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
  },

  /**
   * Update status of subscription/payment
   */
  async updateStatus(filter, status, extraFields = {}) {
    return await getCollection().updateOne(
      filter,
      {
        $set: {
          status,
          ...extraFields,
          updatedAt: new Date()
        }
      }
    );
  }
};

export default SubscriptionModel;
