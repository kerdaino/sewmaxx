import { logger } from '../../config/logger.js';
import { sanitizeBotInput } from './sanitize-bot-input.js';

export const logSafeBotEvent = (ctx, event, extra = {}) => {
  logger.info(
    {
      event,
      chatType: ctx.chat?.type,
      updateType: ctx.updateType,
      telegramUserId: String(ctx.from?.id ?? ''),
      telegramUsername: sanitizeBotInput(ctx.from?.username ?? '', 64),
      ...extra,
    },
    'Telegram bot event',
  );
};
