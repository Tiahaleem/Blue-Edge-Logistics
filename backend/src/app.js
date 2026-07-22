import express from 'express';
import shipmentRoutes from './routes/shipment.routes.js';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import adminRoutes from './routes/admin.routes.js';
import trackRoutes from './routes/track.routes.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        const corsError = new Error(`Origin ${origin} is not allowed by CORS`);
        corsError.status = 403;
        callback(corsError);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/shipments', shipmentRoutes);

app.use('/api/track', trackRoutes);

app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;