import http from 'node:http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { getBotWebhookCallback, startBot, stopBot } from './bot/index.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { telegramWebhookAuthMiddleware } from './middlewares/telegram-webhook-auth.js';
import { getStartupErrorLogContext, serializeErrorForLog } from './utils/error-log.js';

process.on('unhandledRejection', (error) => {
  logger.error(
    {
      error: serializeErrorForLog(error),
      event: 'unhandled_promise_rejection',
    },
    'Unhandled promise rejection',
  );
});

const bootstrap = async () => {
  const port = env.PORT || 3000;
  const host = '0.0.0.0';
  let startupStage = 'database';

  try {
    await connectDatabase();
  } catch (error) {
    error.stage = startupStage;
    throw error;
  }

  let telegramWebhookMiddleware = null;

  if (env.BOT_MODE === 'webhook') {
    telegramWebhookMiddleware = [telegramWebhookAuthMiddleware, getBotWebhookCallback()];
  }

  const app = createApp({ telegramWebhookMiddleware });
  const server = http.createServer(app);
  server.headersTimeout = 15_000;
  server.requestTimeout = 15_000;
  server.keepAliveTimeout = 5_000;

  startupStage = 'server_listen';
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => {
        server.off('error', reject);
        logger.info(
          {
            port,
            host,
            apiPrefix: env.API_PREFIX,
            botMode: env.BOT_MODE,
            nodeEnv: env.NODE_ENV,
          },
          `HTTP server listening on port ${port}`,
        );
        resolve();
      });
    });
  } catch (error) {
    error.stage = startupStage;
    throw error;
  }

  startupStage = 'bot';
  try {
    await startBot();
  } catch (error) {
    error.stage = startupStage;
    throw error;
  }

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
  process.on('uncaughtException', (error) => {
    logger.fatal({ error: serializeErrorForLog(error) }, 'Uncaught exception');
    process.exit(1);
  });
};

bootstrap().catch((error) => {
  logger.fatal(
    {
      error: serializeErrorForLog(error),
      ...getStartupErrorLogContext(error, error?.stage ?? undefined),
    },
    'Fatal startup error',
  );
  process.exit(1);
});
