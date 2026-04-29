import { env } from '../../config/env.js';

const adminIds = [
  env.ADMIN_TELEGRAM_IDS,
  env.ADMIN_TELEGRAM_ID,
  env.TELEGRAM_ADMIN_IDS,
]
  .join(',')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

// Bot admin commands are restricted by Telegram user ID and never inferred from chat membership.
export const isTelegramAdmin = (telegramUserId) =>
  typeof telegramUserId === 'string' && adminIds.includes(telegramUserId);
