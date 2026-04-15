import { env } from '../../config/env.js';

export const buildTelegramReferralLink = (referralCode) => {
  if (!env.TELEGRAM_BOT_USERNAME) {
    return '';
  }

  const encodedCode = encodeURIComponent(referralCode);
  return `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${encodedCode}`;
};
