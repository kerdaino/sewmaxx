import { Router } from 'express';
import { env } from '../config/env.js';
import { telegramWebhookAuthMiddleware } from '../middlewares/telegram-webhook-auth.js';

const router = Router();

router.post(env.TELEGRAM_WEBHOOK_PATH, telegramWebhookAuthMiddleware);

export default router;
