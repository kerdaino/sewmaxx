import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from './api-error.js';

export const isValidObjectId = (value) =>
  typeof value === 'string' && mongoose.isValidObjectId(value.trim());

export const assertValidObjectId = (value, label = 'Resource id') => {
  if (!isValidObjectId(value)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${label} is invalid`);
  }

  return value.trim();
};
