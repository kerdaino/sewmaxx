import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ClientProfile } from '../models/client-profile.model.js';
import { RequestPost } from '../models/request-post.model.js';
import { User } from '../models/user.model.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';
import { buildRequestDedupeKey } from '../utils/request-dedupe.js';

const ACTIVE_REQUEST_STATUSES = ['pending', 'reviewing', 'assigned'];

export const createServiceRequest = async (payload) => {
  const user = await User.findOne({ telegramUserId: payload.clientTelegramUserId }).lean();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client not onboarded');
  }

  const client = await ClientProfile.findOne({ userId: user._id }).lean();

  if (!client) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client not onboarded');
  }

  if (!(payload.dueDate instanceof Date) || Number.isNaN(payload.dueDate.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Due date is invalid');
  }

  if (payload.dueDate.getTime() <= Date.now()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Due date must be in the future');
  }

  const normalizedStyle = String(payload.style ?? '').trim() || payload.outfitType;

  if (payload.outfitType === 'other' && !normalizedStyle) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A request style is required for custom outfit types');
  }

  const dedupeKey = buildRequestDedupeKey({
    clientProfileId: client._id,
    outfitType: payload.outfitType,
    style: normalizedStyle,
    country: payload.country,
    city: payload.city,
    area: payload.area ?? '',
    dueDate: payload.dueDate,
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    currency: payload.currency ?? 'NGN',
  });

  const activeStatusFilter = mongoose.trusted({ $in: ACTIVE_REQUEST_STATUSES });

  const existingActiveRequest = await RequestPost.findOne({
    dedupeKey,
    status: activeStatusFilter,
  })
    .select('_id status createdAt')
    .lean();

  if (existingActiveRequest) {
    logger.info(
      {
        event: 'request_publish_duplicate_found',
        clientProfileId: client._id,
        userId: user._id,
        existingRequestId: existingActiveRequest._id,
        existingStatus: existingActiveRequest.status,
      },
      'Duplicate active request prevented from publishing',
    );
    throw new ApiError(StatusCodes.CONFLICT, 'A similar active request already exists');
  }

  const request = await RequestPost.create({
    clientProfileId: client._id,
    userId: user._id,
    outfitType: payload.outfitType,
    style: normalizedStyle,
    notes: payload.notes ?? '',
    location: {
      city: payload.city,
      state: payload.state ?? '',
      country: payload.country,
      area: payload.area ?? '',
    },
    budgetRange: {
      min: payload.budgetMin ?? null,
      max: payload.budgetMax ?? null,
      currency: payload.currency ?? 'NGN',
    },
    dueDate: payload.dueDate,
    dedupeKey,
    status: 'pending',
    coordinatorStatus: 'unreviewed',
  });

  logger.info(
    {
      event: 'request_publish_succeeded',
      requestId: request._id,
      clientProfileId: client._id,
      userId: user._id,
      status: request.status,
      outfitType: payload.outfitType,
      hasBudgetRange: payload.budgetMin !== null && payload.budgetMax !== null,
      dueDate: payload.dueDate.toISOString(),
    },
    'Client request published successfully',
  );

  return {
    id: request._id,
    status: request.status,
    createdAt: request.createdAt,
  };
};
