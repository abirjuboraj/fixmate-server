import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import notFoundMiddleware from './middlewares/not-found.middleware.js';

const app = express();

// 1. Configure CORS
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

// 2. CRITICAL: Stripe Webhook Route BEFORE express.json()
// Stripe signature verification requires the raw, unparsed request payload buffer.
app.use(
  '/api/v1/webhooks',
  express.raw({ type: 'application/json' }),
  webhookRoutes
);

// 3. Global Body Parser for all remaining JSON routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. API Routes
app.use('/api', routes);

// 5. 404 Not Found Middleware (catches unmatched routes)
app.use(notFoundMiddleware);

// 6. Centralized Error Handling Middleware
app.use(errorMiddleware);

export default app;
