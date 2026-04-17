import { logger } from '../../config/logger.js';
import { sanitizeBotInput } from './sanitize-bot-input.js';

export const logSafeBotEvent = (ctx, event, extra = {}) => {
  logger.debug(
    {
      event,
      chatType: ctx.chat?.type,
      updateType: ctx.updateType,
      hasUserContext: Boolean(ctx.from?.id),
      usernamePresent: Boolean(sanitizeBotInput(ctx.from?.username ?? '', 64)),
      ...extra,
    },
    'Telegram bot event',
  );
};
