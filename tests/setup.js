process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.API_PREFIX = process.env.API_PREFIX || '/api/v1';
process.env.APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sewmaxx_test';
process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'sewmaxx_test';
process.env.TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || 'test_telegram_token_long_enough';
process.env.TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'sewmaxx_test_bot';
process.env.BOT_MODE = process.env.BOT_MODE || 'polling';
process.env.BOT_SESSION_TTL_SECONDS = process.env.BOT_SESSION_TTL_SECONDS || '1800';
process.env.BOT_SESSION_MAX_SESSIONS = process.env.BOT_SESSION_MAX_SESSIONS || '5000';
process.env.TELEGRAM_WEBHOOK_PATH = process.env.TELEGRAM_WEBHOOK_PATH || '/telegram/webhook';
process.env.TELEGRAM_WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET || 'test_webhook_secret_with_enough_length';
process.env.TELEGRAM_WEBHOOK_URL =
  process.env.TELEGRAM_WEBHOOK_URL || 'https://example.com/telegram/webhook';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '100';
process.env.JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '100kb';
process.env.URLENCODED_BODY_LIMIT = process.env.URLENCODED_BODY_LIMIT || '50kb';
process.env.CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000';
process.env.CORS_ALLOW_CREDENTIALS = process.env.CORS_ALLOW_CREDENTIALS || 'false';
process.env.BOT_SPAM_ENABLED = process.env.BOT_SPAM_ENABLED || 'true';
process.env.BOT_SPAM_WINDOW_MS = process.env.BOT_SPAM_WINDOW_MS || '60000';
process.env.BOT_SPAM_MAX_ACTIONS = process.env.BOT_SPAM_MAX_ACTIONS || '8';
process.env.TAILOR_DEFAULT_STATUS = process.env.TAILOR_DEFAULT_STATUS || 'pending_review';
process.env.ADMIN_DEV_TOKEN =
  process.env.ADMIN_DEV_TOKEN || 'test_admin_token_with_enough_length';
process.env.ADMIN_ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS || '';
process.env.TELEGRAM_ADMIN_IDS = process.env.TELEGRAM_ADMIN_IDS || '999999';
