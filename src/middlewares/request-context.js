import crypto from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '../config/logger.js';

export const requestContext = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incomingRequestId = req.headers['x-request-id'];
    const requestId =
      typeof incomingRequestId === 'string' && incomingRequestId.trim()
        ? incomingRequestId.trim()
        : crypto.randomUUID();

    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
