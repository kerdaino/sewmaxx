import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { securityConfig } from './config/security.js';
import { corsMiddleware } from './middlewares/cors.js';
import { errorHandler } from './middlewares/error-handler.js';
import { mongoSanitizeMiddleware } from './middlewares/mongo-sanitize.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { apiRateLimit } from './middlewares/rate-limit.js';
import { requestContext } from './middlewares/request-context.js';
import apiRouter from './routes/router.js';

export const createApp = ({ telegramWebhookMiddleware } = {}) => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestContext);
  app.use(
    helmet({
      // Safe default headers reduce common browser-side attack surface.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(corsMiddleware);
  app.use(express.json({ limit: securityConfig.body.jsonLimit }));
  app.use(express.urlencoded({ extended: false, limit: securityConfig.body.urlencodedLimit }));
  app.use(mongoSanitizeMiddleware);
  app.use(apiRateLimit);

  if (telegramWebhookMiddleware) {
    app.use(env.TELEGRAM_WEBHOOK_PATH, telegramWebhookMiddleware);
  }

  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
