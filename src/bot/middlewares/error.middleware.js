import { serializeErrorForLog } from '../../utils/error-log.js';
import { logger } from '../../config/logger.js';

export const handleBotError = async (error, ctx) => {
  logger.error(
    {
      error: serializeErrorForLog(error),
      updateType: ctx?.updateType,
    },
    'Telegram bot action failed',
  );

  if (ctx?.reply) {
    await ctx.reply('Something went wrong. Please try again later.');
  }
};
