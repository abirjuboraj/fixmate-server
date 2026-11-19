import StripeService from './stripe.service.js';
import SubscriptionModel from '../models/subscription.model.js';
import WebhookEventModel from '../models/webhook-event.model.js';
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
  },

  /**
   * Handles verified Stripe webhook events with idempotency check.
   *
   * @param {import('stripe').Stripe.Event} event
   */
  async handleWebhookEvent(event) {
    const { id: eventId, type, data } = event;

    // Idempotency check: record event atomically. If already exists, return early.
    const isNew = await WebhookEventModel.recordIfNew(eventId, type, data.object);
    if (!isNew) {
      console.log(`[Webhook] Event ${eventId} (${type}) was already processed. Skipping duplicate.`);
      return { received: true, duplicate: true };
    }

    try {
      switch (type) {
        case 'checkout.session.completed': {
          const session = data.object;
          await SubscriptionModel.upsert(
            { customerId: session.customer || session.customer_email },
            {
              stripeSessionId: session.id,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              status: session.payment_status || 'completed',
              customerEmail: session.customer_details?.email || session.customer_email,
              amountTotal: session.amount_total,
              currency: session.currency,
              mode: session.mode
            }
          );
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = data.object;
          await SubscriptionModel.updateStatus(
            { stripeSubscriptionId: subscription.id },
            subscription.status,
            {
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
          );
          break;
        }

        default:
          // Unhandled event type acknowledged safely
          break;
      }

      await WebhookEventModel.markStatus(eventId, 'completed');
      return { received: true };
    } catch (error) {
      await WebhookEventModel.markStatus(eventId, 'failed', error.message);
      throw error;
    }
  }
};

export default PaymentService;
