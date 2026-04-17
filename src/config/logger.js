import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'authorization',
      'cookie',
      'headers.authorization',
      'headers.cookie',
      'headers.x-telegram-bot-api-secret-token',
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-telegram-bot-api-secret-token"]',
      'req.body',
      'request.body',
      'request.query',
      'request.params',
      'telegramToken',
      'botToken',
      'mongodbUri',
      'databaseUri',
      'token',
      'secret',
      'password',
      'phoneNumber',
      'fullName',
      'description',
      'workAddress',
      'notes',
      'referralCode',
      'affiliateCode',
      'telegramUserId',
      'telegramUsername',
      'err.config.headers.Authorization',
      'err.config.auth',
    ],
    censor: '[REDACTED]',
  },
  ...(env.isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});
