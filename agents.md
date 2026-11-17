# Project Development & Architecture Documentation (`agents.md`)

## 1. Project Overview
This repository contains a modular, production-ready, reusable backend starter template designed for Express.js full-stack assignments. It adheres to an MVC architecture enhanced with a Service Layer, uses native ES modules (`import`/`export`), integrates the official MongoDB Native Driver (`MongoClient`), and provides a decoupled Stripe payment and webhook processing foundation.

---

## 2. Directory Structure

```text
assignment_9-server/
├── config/
│   ├── db.js                   # Reusable MongoDB Native Driver connection & database singleton
│   └── stripe.js               # Stripe SDK instance lazy initializer
├── routes/
│   ├── index.routes.js         # Central API route aggregator (/api/v1)
│   ├── health.routes.js        # Health status check route (/api/v1/health)
│   ├── billing.routes.js       # Billing routes (/api/v1/billing)
│   └── webhook.routes.js       # Webhook routes (/api/v1/webhooks)
├── controllers/
│   ├── billing.controller.js   # HTTP controller for checkout sessions
│   └── webhook.controller.js   # HTTP controller for Stripe webhooks
├── services/
│   ├── billing.service.js      # Business logic: line item formatting, idempotency, updates
│   └── stripe.service.js       # Direct Stripe API calls & signature verification
├── models/
│   ├── subscription.model.js   # MongoDB queries for customer subscriptions & payments
│   └── webhook-event.model.js  # MongoDB queries for webhook event idempotency
├── middlewares/
│   ├── auth.middleware.js      # Bearer token authentication middleware placeholder
│   ├── error.middleware.js     # Centralized error handler returning standardized JSON
│   ├── not-found.middleware.js # 404 handler for unmatched routes
│   └── validate.middleware.js  # Generic request validation executor
├── validators/
│   └── billing.validator.js    # Request validation logic for checkout requests
├── utils/
│   ├── ApiError.js             # Standardized operational error class
│   └── asyncHandler.js         # Promise rejection forwarder for Express controllers
├── app.js                      # Express application setup, CORS, raw & json middlewares
├── server.js                   # Startup entrypoint: connects DB before listening on PORT
├── .env                        # Local environment variables (gitignored)
├── .env.example                # Template for required environment variables
├── .gitignore                  # Git ignore rules
└── package.json                # Project dependencies and npm scripts
```

---

## 3. Architecture & File Responsibilities

### Configuration Layer (`config/`)
- **`config/db.js`**:
  - Initializes and maintains a single `MongoClient` connection across the application lifecycle.
  - Reads `MONGODB_URI` and `DB_NAME` from environment variables.
  - Exposes `connectDB()` to connect during startup, and `getDB()` for models and services to access the database instance without re-connecting.
  - Exposes `getClient()` for transactions or graceful shutdown.
- **`config/stripe.js`**:
  - Lazily initializes the Stripe SDK instance using `STRIPE_SECRET_KEY`.
  - Ensures Stripe secrets stay exclusively on the backend.

### Utilities (`utils/`)
- **`utils/ApiError.js`**:
  - Custom subclass of `Error` containing `statusCode`, `success: false`, and an optional `errors` array.
- **`utils/asyncHandler.js`**:
  - Eliminates repetitive `try/catch` boilerplate in controllers by wrapping async handlers and passing caught exceptions to `next(error)`.

### Middleware Layer (`middlewares/`)
- **`middlewares/error.middleware.js`**:
  - Catches all errors passed via `next()`.
  - Normalizes unexpected runtime errors into `ApiError` structures and returns clean JSON with stack traces included only in `development` mode.
- **`middlewares/not-found.middleware.js`**:
  - Catches requests targeting unmapped routes and raises a 404 `ApiError`.
- **`middlewares/validate.middleware.js`**:
  - Executes schema validation functions on incoming requests, returning a 400 Bad Request if validation rules fail.
- **`middlewares/auth.middleware.js`**:
  - Reusable placeholder to inspect Bearer tokens in incoming headers, ready for JWT or session verification logic when requirements are provided.

### Models Layer (`models/`)
- **`models/subscription.model.js`**:
  - Direct MongoDB Native Driver operations against the `subscriptions` collection.
  - Implements `findByCustomerId`, `findBySubscriptionId`, `upsert`, and `updateStatus`.
- **`models/webhook-event.model.js`**:
  - Encapsulates idempotency operations for the `webhook_events` collection.
  - Implements atomic insertion (`recordIfNew`) to prevent duplicate event executions when Stripe retries webhooks.

### Services Layer (`services/`)
- **`services/stripe.service.js`**:
  - Wraps Stripe SDK operations (`checkout.sessions.create` and `webhooks.constructEvent`).
- **`services/billing.service.js`**:
  - Handles billing business logic.
  - Validates line items server-side to prevent trusting client-supplied prices or statuses.
  - Orchestrates checkout session creation and responds to Stripe webhook events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).

### Controllers Layer (`controllers/`)
- **`controllers/billing.controller.js`**:
  - Extracts parameters from `req.body`, invokes `BillingService.createCheckoutSession`, and returns a standardized response.
- **`controllers/webhook.controller.js`**:
  - Validates `stripe-signature` header and delegates raw buffer processing to `StripeService` and `BillingService`.

### Routes Layer (`routes/`)
- **`routes/health.routes.js`**: `GET /api/v1/health` for monitoring server availability.
- **`routes/billing.routes.js`**: `POST /api/v1/billing/create-checkout-session`.
- **`routes/webhook.routes.js`**: `POST /api/v1/webhooks/stripe`.
- **`routes/index.routes.js`**: Central router mounting all standard JSON API routes under `/api/v1`.

### Application & Server Layer (`app.js` & `server.js`)
- **`app.js`**:
  - Mounts CORS with configurable origins (`CLIENT_ORIGIN`).
  - **CRITICAL**: Mounts `/api/v1/webhooks` with `express.raw({ type: 'application/json' })` **before** registering global `express.json()`.
  - Mounts routes, 404 handler, and error middleware.
- **`server.js`**:
  - Bootstraps environment variables via `import 'dotenv/config'`.
  - Connects to MongoDB via `await connectDB()`. If the connection fails, the process exits with code 1.
  - Starts listening on `PORT` once database connectivity is confirmed.

---

## 4. Setup & Running the Server

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure your credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net
   DB_NAME=starter_db
   CLIENT_ORIGIN=http://localhost:3000
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   CLIENT_SUCCESS_URL=http://localhost:3000/payment/success
   CLIENT_CANCEL_URL=http://localhost:3000/payment/cancel
   ```
3. **Run the Application**:
   - Production: `npm start`
   - Development (with nodemon): `npm run dev`
