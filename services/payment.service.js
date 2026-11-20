import StripeService from './stripe.service.js';
import ApiError from '../utils/ApiError.js';

/**
 * payment Service
 * Orchestrates business logic, server-side price validation, and database updates.
 */
export const PaymentService = {
  /**
   * Initializes a checkout session after verifying items server-side.
   *
   * @param {object} payload
   * @param {string} payload.customerEmail
   * @param {'payment'|'subscription'} payload.mode
   * @param {Array} payload.items - Requested items from client
   * @param {object} [payload.metadata] - Extra contextual metadata
   * @returns {Promise<{ sessionId: string, url: string }>}
   */
  async createCheckoutSession({ customerEmail, mode, items, metadata = {} }) {
    // SECURITY: Validate and construct line items on server side.
    // Never trust unit amounts directly passed from client.
    const lineItems = items.map((item) => {
      if (!item.name || !item.unitAmount) {
        throw new ApiError(400, 'Each item must have a valid name and unitAmount in cents.');
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || undefined
          },
          unit_amount: Math.round(Number(item.unitAmount)),
          ...(mode === 'subscription' ? { recurring: { interval: item.interval || 'month' } } : {})
        },
        quantity: item.quantity || 1
      };
    });

    const session = await StripeService.createCheckoutSession({
      customerEmail,
      mode,
      lineItems,
      metadata: {
        ...metadata,
        customerEmail
      }
    });

    return {
      sessionId: session.id,
      url: session.url
    };
  }
};

export default PaymentService;
