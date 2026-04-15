import { env } from './env.js';

const parseAllowedOrigins = (value) =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS);

export const securityConfig = Object.freeze({
  cors: {
    allowedOrigins,
    credentials: env.CORS_ALLOW_CREDENTIALS,
  },
  body: {
    jsonLimit: env.JSON_BODY_LIMIT,
    urlencodedLimit: env.URLENCODED_BODY_LIMIT,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  botSpam: {
    windowMs: env.BOT_SPAM_WINDOW_MS,
    maxActions: env.BOT_SPAM_MAX_ACTIONS,
  },
  webhook: {
    path: env.TELEGRAM_WEBHOOK_PATH,
    secret: env.TELEGRAM_WEBHOOK_SECRET,
  },
});
