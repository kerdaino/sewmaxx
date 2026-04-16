import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { secureCompare } from '../utils/secure-compare.js';

export const telegramWebhookAuthMiddleware = (req, res, next) => {
  const suppliedSecret = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = env.TELEGRAM_WEBHOOK_SECRET || '';

  if (typeof suppliedSecret !== 'string' || !expectedSecret || !secureCompare(suppliedSecret, expectedSecret)) {
    logger.warn({ requestId: req.id, event: 'telegram_webhook_unauthorized' }, 'Rejected Telegram webhook request');
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  req.telegramWebhookVerified = true;
  return next();
};
