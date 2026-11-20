import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import routes from './routes/index.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import notFoundMiddleware from './middlewares/not-found.middleware.js';

const app = express();

// 1. Serverless DB Connection Middleware
// Ensures MongoDB connection is established before route handlers run (essential for Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// 2. Configure CORS
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// 3. Root health check / Welcome
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FixMate API Server is running smoothly 🚀',
    docs: '/api/health',
  });
});

// 4. Global Body Parser for all JSON routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. API Routes
app.use('/api', routes);

// 6. 404 Not Found Middleware (catches unmatched routes)
app.use(notFoundMiddleware);

// 7. Centralized Error Handling Middleware
app.use(errorMiddleware);

export default app;
