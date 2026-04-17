import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
import { repairTailorProfileIndexes } from '../models/tailor-profile-indexes.js';
import { getMongoErrorLogContext, serializeErrorForLog } from '../utils/error-log.js';

let mongoEventListenersRegistered = false;

const registerMongoEventListeners = () => {
  if (mongoEventListenersRegistered) {
    return;
  }

  mongoEventListenersRegistered = true;

  mongoose.connection.on('error', (error) => {
    logger.error(
      {
        error: serializeErrorForLog(error),
        ...getMongoErrorLogContext(error),
      },
      'MongoDB connection emitted an error',
    );
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn({ dbName: env.MONGODB_DB_NAME }, 'MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info({ dbName: env.MONGODB_DB_NAME }, 'MongoDB reconnected');
  });
};

export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);

  registerMongoEventListeners();

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      autoIndex: !env.isProduction,
    });

    await repairTailorProfileIndexes();

    logger.info(
      {
        dbName: env.MONGODB_DB_NAME,
        autoIndex: !env.isProduction,
      },
      'MongoDB connected',
    );
  } catch (error) {
    logger.fatal(
      {
        dbName: env.MONGODB_DB_NAME,
        error: serializeErrorForLog(error),
        ...getMongoErrorLogContext(error),
      },
      'MongoDB connection failed',
    );
    throw error;
  }
};
