import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import urlsRouter from './routes/urls.js';
import analyticsRouter from './routes/analytics.js';
import keysRouter from './routes/keys.js';
import usageRouter from './routes/usage.js';
import redirectRouter from './routes/redirect.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

app.disable('x-powered-by');

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.headers['x-request-id'] || crypto.randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
  }),
);
app.use(helmet());
app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/urls', urlsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/keys', keysRouter);
app.use('/api/v1/usage', usageRouter);
// Short links live at the root, e.g. /portfolio. This must come AFTER the /api routes.
app.use('/', redirectRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
