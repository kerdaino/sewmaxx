import { env } from './env.js';

const parseAllowedOrigins = (value) =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const parseAllowedIps = (value) =>
  value
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

const allowedOrigins = parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS);
const allowedAdminIps = parseAllowedIps(env.ADMIN_ALLOWED_IPS);

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
    enabled: env.BOT_SPAM_ENABLED,
    windowMs: env.isDevelopment ? Math.min(env.BOT_SPAM_WINDOW_MS, 15 * 1000) : env.BOT_SPAM_WINDOW_MS,
    maxActions: env.isDevelopment ? Math.max(env.BOT_SPAM_MAX_ACTIONS, 20) : env.BOT_SPAM_MAX_ACTIONS,
  },
  botSession: {
    maxSessions: env.BOT_SESSION_MAX_SESSIONS,
  },
  admin: {
    allowedIps: allowedAdminIps,
  },
  webhook: {
    path: env.TELEGRAM_WEBHOOK_PATH,
    secret: env.TELEGRAM_WEBHOOK_SECRET,
  },
});
