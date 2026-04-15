import crypto from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const extractBearerToken = (authorizationHeader = '') => {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice(7).trim();
};

export const adminAuthMiddleware = (req, res, next) => {
  // Development-only token auth. Replace with real operator auth, RBAC, and short-lived credentials in production.
  const suppliedToken = extractBearerToken(req.headers.authorization);
  const expectedToken = env.ADMIN_DEV_TOKEN || '';

  if (!suppliedToken || !expectedToken) {
    logger.warn({ requestId: req.id, event: 'admin_auth_missing' }, 'Rejected admin request');
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const suppliedBuffer = Buffer.from(suppliedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    logger.warn({ requestId: req.id, event: 'admin_auth_failed' }, 'Rejected admin request');
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  req.adminAuth = {
    strategy: 'dev_token',
  };

  return next();
};
