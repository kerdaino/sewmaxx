import cors from 'cors';
import { securityConfig } from '../config/security.js';

const isOriginAllowed = (origin) =>
  securityConfig.cors.allowedOrigins.includes(origin);

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow non-browser clients and same-origin server-to-server requests.
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: securityConfig.cors.credentials,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Telegram-Bot-Api-Secret-Token'],
  optionsSuccessStatus: 204,
});
