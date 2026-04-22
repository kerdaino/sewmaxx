import { Telegraf } from 'telegraf';
import { BOT_MODES } from '../constants/app.constants.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { handleBotError } from './middlewares/error.middleware.js';
import { botInputSanitizerMiddleware } from './middlewares/input-sanitizer.middleware.js';
import { botLoggingMiddleware } from './middlewares/logging.middleware.js';
import { botSessionMiddleware } from './middlewares/session.middleware.js';
import { botAntiSpamMiddleware } from '../middlewares/bot-anti-spam.js';
import { createBotRouter } from './router.js';
import { syncBotCommands } from './services/command-sync.service.js';

let botInstance;

export const getBot = () => {
  if (!botInstance) {
    botInstance = new Telegraf(env.TELEGRAM_BOT_TOKEN, {
      telegram: {
        webhookReply: env.BOT_MODE === BOT_MODES.WEBHOOK,
      },
    });

    // Middleware order matters: sanitize and throttle before routing to reduce abuse surface.
    botInstance.use((ctx, next) => {
      ctx.state = ctx.state ?? {};
      return next();
    });
    botInstance.use(botLoggingMiddleware);
    botInstance.use(botSessionMiddleware);
    botInstance.use(botInputSanitizerMiddleware);
    botInstance.use(botAntiSpamMiddleware);
    botInstance.use(createBotRouter());
    botInstance.catch(handleBotError);
  }

  return botInstance;
};

export const startBot = async () => {
  const bot = getBot();
  await syncBotCommands(bot);

  if (env.BOT_MODE === BOT_MODES.POLLING) {
    await bot.launch({
      dropPendingUpdates: true,
    });
    logger.info('Telegram bot started in polling mode');
    return;
  }

  logger.info({ webhookPath: env.TELEGRAM_WEBHOOK_PATH }, 'Telegram bot initialized for webhook mode');
};

export const getBotWebhookCallback = () => getBot().webhookCallback(env.TELEGRAM_WEBHOOK_PATH);

export const stopBot = async (signal) => {
  if (!botInstance) {
    return;
  }

  await botInstance.stop(signal);
};
