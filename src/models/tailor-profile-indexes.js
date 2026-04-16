import mongoose from 'mongoose';
import { TailorProfile } from './tailor-profile.model.js';
import { logger } from '../config/logger.js';

const hasParallelArrayKeyPattern = (index) =>
  index &&
  typeof index === 'object' &&
  index.key &&
  typeof index.key === 'object' &&
  Object.prototype.hasOwnProperty.call(index.key, 'styles') &&
  Object.prototype.hasOwnProperty.call(index.key, 'specialties');

export const repairTailorProfileIndexes = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collection = TailorProfile.collection;
  let indexes = [];

  try {
    indexes = await collection.indexes();
  } catch (error) {
    if (error?.codeName === 'NamespaceNotFound') {
      await TailorProfile.init();
      return;
    }

    throw error;
  }

  const invalidIndexes = indexes.filter(hasParallelArrayKeyPattern);

  for (const index of invalidIndexes) {
    await collection.dropIndex(index.name);
    logger.warn(
      {
        event: 'tailor_profile_invalid_index_dropped',
        collectionName: collection.collectionName,
        indexName: index.name,
      },
      'Dropped invalid TailorProfile compound array index',
    );
  }

  await TailorProfile.init();
};
