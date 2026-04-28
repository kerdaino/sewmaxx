import { Telegraf } from 'telegraf';
import { BOT_MODES } from '../constants/app.constants.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { serializeErrorForLog } from '../utils/error-log.js';
import { handleBotError } from './middlewares/error.middleware.js';
import { botInputSanitizerMiddleware } from './middlewares/input-sanitizer.middleware.js';
import { botLoggingMiddleware } from './middlewares/logging.middleware.js';
import { botSessionMiddleware } from './middlewares/session.middleware.js';
import { botAntiSpamMiddleware } from '../middlewares/bot-anti-spam.js';
import { createBotRouter } from './router.js';
import { syncBotCommands } from './services/command-sync.service.js';

let botInstance;
let pollingStarted = false;

const getTelegramUpdateType = (update) =>
  Object.keys(update ?? {}).find((key) => key !== 'update_id') ?? 'unknown';

export const getBot = () => {
  if (!botInstance) {
    botInstance = new Telegraf(env.TELEGRAM_BOT_TOKEN, {
      telegram: {
        webhookReply: false,
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
    pollingStarted = true;
    logger.info('Telegram bot started in polling mode');
    return;
  }

  try {
    await bot.telegram.setWebhook(env.TELEGRAM_WEBHOOK_URL, {
      secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    });

    logger.info(
      {
        event: 'telegram_webhook_configured',
        webhookUrl: env.TELEGRAM_WEBHOOK_URL,
        webhookPath: env.TELEGRAM_WEBHOOK_PATH,
      },
      'Telegram webhook configured',
    );
  } catch (error) {
    logger.warn(
      {
        error: serializeErrorForLog(error),
        event: 'telegram_webhook_configuration_failed',
        webhookUrl: env.TELEGRAM_WEBHOOK_URL,
        webhookPath: env.TELEGRAM_WEBHOOK_PATH,
      },
      'Telegram webhook configuration failed; HTTP webhook route remains available',
    );
  }

  logger.info({ webhookPath: env.TELEGRAM_WEBHOOK_PATH }, 'Telegram bot initialized for webhook mode');
};

export const getBotWebhookCallback = () => (req, res) => {
  const updateType = getTelegramUpdateType(req.body);

  logger.info(
    {
      event: 'telegram_webhook_received',
      requestId: req.id,
      webhookPath: req.path,
      updateId: req.body?.update_id,
      updateType,
    },
    'Telegram webhook request received',
  );

  res.sendStatus(200);

  setImmediate(() => {
    Promise.resolve(getBot().handleUpdate(req.body)).catch((error) => {
      logger.error(
        {
          error: serializeErrorForLog(error),
          event: 'telegram_webhook_processing_failed',
          requestId: req.id,
          updateId: req.body?.update_id,
          updateType,
        },
        'Telegram webhook update processing failed',
      );
    });
  });
};

export const stopBot = async (signal) => {
  if (!botInstance || !pollingStarted) {
    return;
  }

  await botInstance.stop(signal);
  pollingStarted = false;
};
