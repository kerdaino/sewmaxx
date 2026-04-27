import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const raiseConfigError = (message, details = []) => {
  const formattedDetails = details.length > 0 ? ` Issues: ${details.join('; ')}` : '';
  process.stderr.write(`[startup] Configuration error: ${message}${formattedDetails}\n`);

  const error = new Error(`${message}${formattedDetails}`);
  error.code = 'ENV_VALIDATION_ERROR';
  throw error;
};

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().pattern(/^\/[A-Za-z0-9/_-]*$/).default('/api/v1'),
  APP_BASE_URL: Joi.string().uri().required(),
  MONGODB_URI: Joi.string().required(),
  MONGODB_DB_NAME: Joi.string().required(),
  TELEGRAM_BOT_TOKEN: Joi.string().trim().min(20).required(),
  TELEGRAM_BOT_USERNAME: Joi.string().allow('').optional(),
  BOT_MODE: Joi.string().valid('polling', 'webhook').default('polling'),
  BOT_SESSION_TTL_SECONDS: Joi.number().integer().positive().default(1800),
  BOT_SESSION_MAX_SESSIONS: Joi.number().integer().min(100).max(50000).default(5000),
  TELEGRAM_WEBHOOK_PATH: Joi.string().pattern(/^\/[A-Za-z0-9/_-]*$/).default('/telegram/webhook'),
  TELEGRAM_WEBHOOK_SECRET: Joi.string().min(24).when('BOT_MODE', {
    is: 'webhook',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  TELEGRAM_WEBHOOK_URL: Joi.string().uri().allow('').optional(),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().positive().default(100),
  JSON_BODY_LIMIT: Joi.string().default('100kb'),
  URLENCODED_BODY_LIMIT: Joi.string().default('50kb'),
  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
  CORS_ALLOW_CREDENTIALS: Joi.boolean().truthy('true').falsy('false').default(false),
  BOT_SPAM_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  BOT_SPAM_WINDOW_MS: Joi.number().integer().positive().default(60 * 1000),
  BOT_SPAM_MAX_ACTIONS: Joi.number().integer().positive().default(8),
  TAILOR_DEFAULT_STATUS: Joi.string().valid('pending_review', 'active').default('pending_review'),
  TAILOR_TERMS_PDF_URL: Joi.string().uri().allow('').default(''),
  ADMIN_DEV_TOKEN: Joi.string().min(24).allow('').optional(),
  ADMIN_ALLOWED_IPS: Joi.string().allow('').default(''),
  TELEGRAM_ADMIN_IDS: Joi.string().allow('').default(''),
}).unknown();

const { error, value } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  raiseConfigError(
    'Environment validation failed.',
    error.details?.map((detail) => detail.message) ?? [error.message],
  );
}

// Production Telegram updates should arrive through HTTPS webhooks so the app can verify Telegram's secret header.
if (value.NODE_ENV === 'production' && value.BOT_MODE !== 'webhook') {
  raiseConfigError('Production requires BOT_MODE=webhook for safer Telegram deployment.');
}

if (value.BOT_MODE === 'webhook' && !value.TELEGRAM_WEBHOOK_URL) {
  raiseConfigError('TELEGRAM_WEBHOOK_URL is required when BOT_MODE=webhook.');
}

if (value.NODE_ENV === 'production' && !value.APP_BASE_URL.startsWith('https://')) {
  raiseConfigError('APP_BASE_URL must use HTTPS in production.');
}

if (value.NODE_ENV === 'production' && value.TELEGRAM_WEBHOOK_URL && !value.TELEGRAM_WEBHOOK_URL.startsWith('https://')) {
  raiseConfigError('TELEGRAM_WEBHOOK_URL must use HTTPS in production.');
}

if (value.NODE_ENV !== 'production' && !value.ADMIN_DEV_TOKEN) {
  raiseConfigError('ADMIN_DEV_TOKEN is required for development admin endpoints.');
}

export const env = Object.freeze({
  ...value,
  isProduction: value.NODE_ENV === 'production',
  isDevelopment: value.NODE_ENV === 'development',
});
