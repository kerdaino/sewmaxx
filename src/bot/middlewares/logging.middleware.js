import { logSafeBotEvent } from '../utils/log-safe-bot-event.js';

export const botLoggingMiddleware = async (ctx, next) => {
  logSafeBotEvent(ctx, 'bot_update_received');
  await next();
};
