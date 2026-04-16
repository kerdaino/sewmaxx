import { StatusCodes } from 'http-status-codes';
import { ClientProfile } from '../models/client-profile.model.js';
import { RequestPost } from '../models/request-post.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';
import { buildRequestDedupeKey } from '../utils/request-dedupe.js';

const ACTIVE_REQUEST_STATUSES = ['draft', 'published', 'matching', 'assigned'];

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

  const dedupeKey = buildRequestDedupeKey({
    clientProfileId: client._id,
    outfitType: payload.outfitType,
    style: payload.style ?? '',
    country: payload.country,
    city: payload.city,
    area: payload.area ?? '',
    dueDate: payload.dueDate,
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    currency: payload.currency ?? 'NGN',
  });

  const existingActiveRequest = await RequestPost.findOne({
    dedupeKey,
    status: { $in: ACTIVE_REQUEST_STATUSES },
  })
    .select('_id status createdAt')
    .lean();

  if (existingActiveRequest) {
    throw new ApiError(StatusCodes.CONFLICT, 'A similar active request already exists');
  }

  const request = await RequestPost.create({
    clientProfileId: client._id,
    userId: user._id,
    outfitType: payload.outfitType,
    style: payload.style ?? '',
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
    status: 'published',
    coordinatorStatus: 'unreviewed',
  });

  return {
    id: request._id,
    status: request.status,
    createdAt: request.createdAt,
  };
};
