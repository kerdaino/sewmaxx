import { securityConfig } from '../config/security.js';
import { logger } from '../config/logger.js';

const interactionStore = new Map();

const now = () => Date.now();

const getBucket = (key) => {
  const bucket = interactionStore.get(key);

  if (!bucket || bucket.resetAt <= now()) {
    const nextBucket = {
      count: 0,
      resetAt: now() + securityConfig.botSpam.windowMs,
    };
    interactionStore.set(key, nextBucket);
    return nextBucket;
  }

  return bucket;
};

export const botAntiSpamMiddleware = async (ctx, next) => {
  const userId = String(ctx.from?.id ?? 'anonymous');
  const bucket = getBucket(userId);
  bucket.count += 1;

  // Keep the bot responsive while slowing repeated abuse from a single sender.
  if (bucket.count > securityConfig.botSpam.maxActions) {
    logger.warn({ event: 'bot_rate_limit', updateType: ctx.updateType }, 'Blocked suspected bot spam');
    await ctx.reply('Too many requests. Please wait a moment and try again.');
    return;
  }

  await next();
};
