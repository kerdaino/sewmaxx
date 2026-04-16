import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { securityConfig } from '../config/security.js';

export const apiRateLimit = rateLimit({
  // A small default limit helps slow credential stuffing and endpoint abuse.
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === env.TELEGRAM_WEBHOOK_PATH ||
    req.path === '/health' ||
    req.path === `${env.API_PREFIX}/health`,
  message: {
    success: false,
    message: 'Too many requests',
  },
});
