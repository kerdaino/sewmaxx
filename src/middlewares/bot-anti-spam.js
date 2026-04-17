import { env } from '../config/env.js';
import { securityConfig } from '../config/security.js';
import { logger } from '../config/logger.js';

const interactionStore = new Map();

const now = () => Date.now();
const MAX_TRACKED_SENDERS = Math.max(securityConfig.botSession.maxSessions, 500);
const SHORT_WINDOW_MS = env.isDevelopment ? 2 * 1000 : Math.min(securityConfig.botSpam.windowMs, 10 * 1000);
const DUPLICATE_ACTION_COOLDOWN_MS = env.isDevelopment ? 250 : 1200;
const COMMAND_BURST_LIMIT = env.isDevelopment
  ? Math.max(securityConfig.botSpam.maxActions * 2, 14)
  : Math.max(Math.ceil(securityConfig.botSpam.maxActions / 2), 4);
const CALLBACK_BURST_LIMIT = env.isDevelopment
  ? Math.max(securityConfig.botSpam.maxActions * 3, 18)
  : Math.max(securityConfig.botSpam.maxActions, 6);

const pruneInteractionStore = () => {
  if (interactionStore.size < MAX_TRACKED_SENDERS) {
    return;
  }

  for (const [key, bucket] of interactionStore.entries()) {
    if (bucket.resetAt <= now()) {
      interactionStore.delete(key);
    }
  }

  if (interactionStore.size < MAX_TRACKED_SENDERS) {
    return;
  }

  const oldestBuckets = [...interactionStore.entries()]
    .sort((left, right) => left[1].resetAt - right[1].resetAt)
    .slice(0, interactionStore.size - MAX_TRACKED_SENDERS + 1);

  for (const [key] of oldestBuckets) {
    interactionStore.delete(key);
  }
};

const getBucket = (key) => {
  pruneInteractionStore();
  const bucket = interactionStore.get(key);

  if (!bucket || bucket.resetAt <= now()) {
    const nextBucket = {
      general: {
        count: 0,
        resetAt: now() + securityConfig.botSpam.windowMs,
      },
      command: {
        count: 0,
        resetAt: now() + SHORT_WINDOW_MS,
      },
      callback: {
        count: 0,
        resetAt: now() + SHORT_WINDOW_MS,
      },
      lastActionKey: '',
      lastActionAt: 0,
      resetAt: now() + securityConfig.botSpam.windowMs,
    };
    interactionStore.set(key, nextBucket);
    return nextBucket;
  }

  if (bucket.general.resetAt <= now()) {
    bucket.general = {
      count: 0,
      resetAt: now() + securityConfig.botSpam.windowMs,
    };
  }

  if (bucket.command.resetAt <= now()) {
    bucket.command = {
      count: 0,
      resetAt: now() + SHORT_WINDOW_MS,
    };
  }

  if (bucket.callback.resetAt <= now()) {
    bucket.callback = {
      count: 0,
      resetAt: now() + SHORT_WINDOW_MS,
    };
  }

  bucket.resetAt = Math.max(bucket.general.resetAt, bucket.command.resetAt, bucket.callback.resetAt);

  return bucket;
};

const getActionKey = (ctx) => {
  if (typeof ctx.message?.text === 'string' && ctx.message.text.startsWith('/')) {
    const [command = ''] = ctx.message.text.trim().split(/\s+/, 1);
    return `command:${command.toLowerCase()}`;
  }

  if (typeof ctx.callbackQuery?.data === 'string' && ctx.callbackQuery.data) {
    return `callback:${ctx.callbackQuery.data}`;
  }

  return `${ctx.updateType}:${ctx.chat?.type ?? 'chat'}`;
};

const replyRateLimitMessage = async (ctx, message) => {
  if (ctx.callbackQuery && ctx.answerCbQuery) {
    await ctx.answerCbQuery(message);
    return;
  }

  await ctx.reply(message);
};

export const botAntiSpamMiddleware = async (ctx, next) => {
  if (!securityConfig.botSpam.enabled) {
    await next();
    return;
  }

  const userId = String(ctx.from?.id ?? 'anonymous');
  const bucket = getBucket(userId);
  const currentTime = now();
  bucket.general.count += 1;

  const actionKey = getActionKey(ctx);
  const isCommand = actionKey.startsWith('command:');
  const isCallback = actionKey.startsWith('callback:');

  if (bucket.lastActionKey === actionKey && currentTime - bucket.lastActionAt < DUPLICATE_ACTION_COOLDOWN_MS) {
    logger.warn({ event: 'bot_duplicate_action_blocked', updateType: ctx.updateType }, 'Blocked repeated bot action');
    await replyRateLimitMessage(ctx, 'Please wait a moment before repeating that action.');
    return;
  }

  bucket.lastActionKey = actionKey;
  bucket.lastActionAt = currentTime;

  if (isCommand) {
    bucket.command.count += 1;

    if (bucket.command.count > COMMAND_BURST_LIMIT) {
      logger.warn({ event: 'bot_command_burst_limited', updateType: ctx.updateType }, 'Blocked command burst');
      await replyRateLimitMessage(ctx, 'Too many commands too quickly. Please slow down a little.');
      return;
    }
  }

  if (isCallback) {
    bucket.callback.count += 1;

    if (bucket.callback.count > CALLBACK_BURST_LIMIT) {
      logger.warn({ event: 'bot_callback_burst_limited', updateType: ctx.updateType }, 'Blocked callback burst');
      await replyRateLimitMessage(ctx, 'Too many button taps too quickly. Please wait a moment.');
      return;
    }
  }

  // Keep the bot responsive while slowing repeated abuse from a single sender.
  if (bucket.general.count > securityConfig.botSpam.maxActions) {
    logger.warn({ event: 'bot_rate_limit', updateType: ctx.updateType }, 'Blocked suspected bot spam');
    await replyRateLimitMessage(ctx, 'Too many requests. Please wait a moment and try again.');
    return;
  }

  await next();
};
