import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { securityConfig } from '../config/security.js';
import { secureCompare } from '../utils/secure-compare.js';

const extractBearerToken = (authorizationHeader = '') => {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice(7).trim();
};

export const adminAuthMiddleware = (req, res, next) => {
  // Development-only token auth. Replace with real operator auth, RBAC, and short-lived credentials in production.
  if (securityConfig.admin.allowedIps.length > 0 && !securityConfig.admin.allowedIps.includes(req.ip)) {
    logger.warn({ requestId: req.id, event: 'admin_auth_ip_denied', ip: req.ip }, 'Rejected admin request');
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'Forbidden',
    });
  }

  const suppliedToken = extractBearerToken(req.headers.authorization);
  const expectedToken = env.ADMIN_DEV_TOKEN || '';

  if (!suppliedToken || !expectedToken) {
    logger.warn({ requestId: req.id, event: 'admin_auth_missing' }, 'Rejected admin request');
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  if (!secureCompare(suppliedToken, expectedToken)) {
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
