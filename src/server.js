import http from 'node:http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { getBotWebhookCallback, startBot, stopBot } from './bot/index.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { serializeErrorForLog } from './utils/error-log.js';

const bootstrap = async () => {
  await connectDatabase();

  let telegramWebhookMiddleware = null;

  if (env.BOT_MODE === 'webhook') {
    telegramWebhookMiddleware = (req, res, next) => {
      const secret = req.headers['x-telegram-bot-api-secret-token'];

      if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        logger.warn({ requestId: req.id }, 'Rejected Telegram webhook request');
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      return getBotWebhookCallback()(req, res, next);
    };
  }

  const app = createApp({ telegramWebhookMiddleware });
  const server = http.createServer(app);
  server.headersTimeout = 15_000;
  server.requestTimeout = 15_000;
  server.keepAliveTimeout = 5_000;

  await startBot();

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, apiPrefix: env.API_PREFIX }, 'Sewmaxx server started');
  });

  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      try {
        await stopBot(signal);
        await mongoose.connection.close();
        logger.info('HTTP server closed');
        process.exit(0);
      } catch (error) {
        logger.error({ error: serializeErrorForLog(error) }, 'Graceful shutdown failed');
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('unhandledRejection', (error) => {
    logger.error({ error: serializeErrorForLog(error) }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ error: serializeErrorForLog(error) }, 'Uncaught exception');
    process.exit(1);
  });
};

bootstrap().catch((error) => {
  logger.fatal({ error: serializeErrorForLog(error) }, 'Fatal startup error');
  process.exit(1);
});
