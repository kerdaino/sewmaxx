import { env } from '../../config/env.js';

const adminIds = env.TELEGRAM_ADMIN_IDS
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

export const isTelegramAdmin = (telegramUserId) =>
  typeof telegramUserId === 'string' && adminIds.includes(telegramUserId);
