import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requireAuth } from './middlewares/auth.js';
import { errorHandler, notFound } from './middlewares/errors.js';
import crudRoutes from './routes/crud.js';
import orderRoutes from './routes/orders.js';
import reportRoutes from './routes/reports.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_request, response) => response.json({ status: 'ok', service: 'atelier-api' }));
app.use(['/api/v1', '/v1'], requireAuth, crudRoutes, orderRoutes, reportRoutes);
app.use(notFound);
app.use(errorHandler);
