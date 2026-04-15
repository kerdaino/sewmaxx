import { Router } from 'express';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const router = Router();

router.post(env.TELEGRAM_WEBHOOK_PATH, (req, res, next) => {
  const secret = req.headers['x-telegram-bot-api-secret-token'];

  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    logger.warn({ requestId: req.id }, 'Rejected Telegram webhook request');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  req.telegramWebhookVerified = true;
  return next();
});

export default router;
