import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import healthRouter from './routes/health.js';
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

app.use(notFound);
app.use(errorHandler);

export default app;
