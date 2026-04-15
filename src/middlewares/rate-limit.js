import rateLimit from 'express-rate-limit';
import { securityConfig } from '../config/security.js';

export const apiRateLimit = rateLimit({
  // A small default limit helps slow credential stuffing and endpoint abuse.
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests',
  },
});
