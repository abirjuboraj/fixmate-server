import { getDB } from '../config/db.js';

const COLLECTION_NAME = 'webhook_events';

/**
 * Access the webhook events collection.
 * @returns {import('mongodb').Collection}
 */
const getCollection = () => getDB().collection(COLLECTION_NAME);

/**
 * Webhook Event Model
 * Provides idempotency storage and status tracking for incoming Stripe webhooks.
 */
export const WebhookEventModel = {
  /**
   * Find a processed or recorded event by Stripe Event ID
   * @param {string} eventId
   */
  async findById(eventId) {
    return await getCollection().findOne({ eventId });
  },

  /**
   * Atomically records an event for idempotency protection.
   * If an event with this ID already exists, the insert will fail with duplicate key or return null.
   *
   * @param {string} eventId
   * @param {string} type - Stripe event type (e.g. checkout.session.completed)
   * @param {object} payload - Raw or summarized event object
   * @returns {Promise<boolean>} True if newly inserted, false if already processed
   */
  async recordIfNew(eventId, type, payload = {}) {
    try {
      await getCollection().insertOne({
        eventId,
        type,
        status: 'processing',
        payload,
        createdAt: new Date()
      });
      return true;
    } catch (error) {
      // 11000 is MongoDB duplicate key error code
      if (error.code === 11000) {
        return false;
      }
      throw error;
    }
  },

  /**
   * Updates status of event after processing
   * @param {string} eventId
   * @param {'completed'|'failed'} status
   * @param {string} [errorReason]
   */
  async markStatus(eventId, status, errorReason = null) {
    return await getCollection().updateOne(
      { eventId },
      {
        $set: {
          status,
          errorReason,
          processedAt: new Date()
        }
      }
    );
  }
};

export default WebhookEventModel;
