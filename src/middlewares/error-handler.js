import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';
import { serializeErrorForLog } from '../utils/error-log.js';

export const errorHandler = (err, req, res, next) => {
  void next;

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Invalid request payload';
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation failed';
  } else if (err?.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    message = 'Duplicate record';
  }

  const logPayload = {
    error: serializeErrorForLog(err),
    requestId: req.id,
    path: req.originalUrl,
    method: req.method,
    statusCode,
  };

  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    logger.error(
      logPayload,
      'Request failed',
    );
  } else {
    logger.warn(
      logPayload,
      'Request rejected',
    );
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDevelopment && err instanceof ApiError && err.details
      ? { details: err.details }
      : {}),
  });
};
