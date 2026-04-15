import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    autoIndex: !env.isProduction,
  });

  // Avoid logging the URI itself; the database name is enough for observability.
  logger.info({ dbName: env.MONGODB_DB_NAME }, 'MongoDB connected');
};
