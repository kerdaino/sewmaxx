import { StatusCodes } from 'http-status-codes';
import { AffiliateProfile } from '../models/affiliate-profile.model.js';
import { RequestPost } from '../models/request-post.model.js';
import { SearchSession } from '../models/search-session.model.js';
import { TailorProfile } from '../models/tailor-profile.model.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';
import { assertValidObjectId } from '../utils/object-id.js';

export const listRecentAffiliates = async ({ limit, requestId }) => {
  const affiliates = await AffiliateProfile.find({})
    .select(
      'userId displayName fullName affiliateCode status verificationStatus onboardingCompletedAt createdAt +phoneNumber +kycDetails.legalPhoneNumber +kycDetails.country +kycDetails.city +kycDetails.idDocument.telegramFileId +kycDetails.selfieWithId.telegramFileId',
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({ path: 'userId', select: 'telegramUsername' })
    .lean();

  logger.info(
    { requestId, event: 'admin_list_recent_affiliates', resultCount: affiliates.length },
    'Admin query executed',
  );

  return affiliates;
};

export const listRecentClientRequests = async ({ limit, requestId }) => {
  const requests = await RequestPost.find({})
    .select('clientProfileId userId outfitType style location budgetRange dueDate status coordinatorStatus createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({ path: 'userId', select: 'telegramUsername' })
    .populate({ path: 'clientProfileId', select: 'fullName +phoneNumber' })
    .lean();

  logger.info(
    { requestId, event: 'admin_list_recent_client_requests', resultCount: requests.length },
    'Admin query executed',
  );

  return requests;
};

export const listRecentTailorSignups = async ({ limit, requestId }) => {
  const tailors = await TailorProfile.find({})
    .select(
      'userId publicName businessName location specialties status verificationStatus onboardingCompletedAt createdAt +phoneNumber portfolio kyc onboardingAgreement',
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({ path: 'userId', select: 'telegramUsername' })
    .lean();

  logger.info(
    { requestId, event: 'admin_list_recent_tailor_signups', resultCount: tailors.length },
    'Admin query executed',
  );

  return tailors;
};

export const getAdminTailorReview = async ({ tailorId, requestId }) => {
  const normalizedTailorId = assertValidObjectId(tailorId, 'Tailor id');

  const tailor = await TailorProfile.findById(normalizedTailorId)
    .select(
      'userId fullName publicName businessName location workAddress specialties status verificationStatus onboardingCompletedAt createdAt +phoneNumber portfolio kyc onboardingAgreement',
    )
    .populate({ path: 'userId', select: 'telegramUsername' })
    .lean();

  if (!tailor) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Tailor not found');
  }

  logger.info(
    { requestId, event: 'admin_tailor_review_loaded', tailorId: normalizedTailorId },
    'Admin tailor review loaded',
  );

  return tailor;
};

export const getAdminAffiliateReview = async ({ affiliateId, requestId }) => {
  const normalizedAffiliateId = assertValidObjectId(affiliateId, 'Affiliate id');

  const affiliate = await AffiliateProfile.findById(normalizedAffiliateId)
    .select(
      'userId fullName displayName affiliateCode status verificationStatus onboardingCompletedAt createdAt +phoneNumber location +kycDetails.legalPhoneNumber +kycDetails.country +kycDetails.city +kycDetails.idDocument.telegramFileId +kycDetails.idDocument.telegramFileUniqueId +kycDetails.idDocument.telegramFileType +kycDetails.idDocument.mimeType +kycDetails.idDocument.fileName +kycDetails.idDocument.submittedAt +kycDetails.selfieWithId.telegramFileId +kycDetails.selfieWithId.telegramFileUniqueId +kycDetails.selfieWithId.telegramFileType +kycDetails.selfieWithId.mimeType +kycDetails.selfieWithId.fileName +kycDetails.selfieWithId.submittedAt',
    )
    .populate({ path: 'userId', select: 'telegramUsername' })
    .lean();

  if (!affiliate) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Affiliate not found');
  }

  logger.info(
    { requestId, event: 'admin_affiliate_review_loaded', affiliateId: normalizedAffiliateId },
    'Admin affiliate review loaded',
  );

  return affiliate;
};

export const reviewSearchSessions = async ({ limit, requestId }) => {
  const sessions = await SearchSession.find({})
    .select('style location budgetRange matchedTailorCount status lastInteractionAt createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  logger.info(
    { requestId, event: 'admin_review_search_sessions', resultCount: sessions.length },
    'Admin query executed',
  );

  return sessions;
};

export const updateTailorApprovalStatus = async ({
  tailorId,
  verificationStatus,
  adminTelegramUserId,
  auditRequestId,
}) => {
  const normalizedTailorId = assertValidObjectId(tailorId, 'Tailor id');

  if (!['approved', 'rejected'].includes(verificationStatus)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid tailor verification status');
  }

  const tailor = await TailorProfile.findByIdAndUpdate(
    normalizedTailorId,
    {
      $set: {
        verificationStatus,
        status: verificationStatus === 'approved' ? 'active' : 'inactive',
        'internalAudit.lastReviewedAt': new Date(),
      },
      $addToSet: {
        'internalAudit.riskFlags': verificationStatus === 'rejected' ? 'rejected_by_admin' : 'approved_by_admin',
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select('publicName businessName location specialties status verificationStatus onboardingCompletedAt createdAt')
    .lean();

  if (!tailor) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Tailor not found');
  }

  logger.info(
    {
      requestId: auditRequestId,
      event: 'admin_tailor_approval_updated',
      tailorId: normalizedTailorId,
      verificationStatus,
      adminTelegramUserId,
    },
    'Admin tailor approval updated',
  );

  return tailor;
};

export const updateAffiliateApprovalStatus = async ({
  affiliateId,
  verificationStatus,
  adminTelegramUserId,
  auditRequestId,
}) => {
  const normalizedAffiliateId = assertValidObjectId(affiliateId, 'Affiliate id');

  if (!['approved', 'rejected'].includes(verificationStatus)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid affiliate verification status');
  }

  const affiliate = await AffiliateProfile.findByIdAndUpdate(
    normalizedAffiliateId,
    {
      $set: {
        verificationStatus,
        status: verificationStatus === 'approved' ? 'active' : 'inactive',
        'internalAudit.lastReviewedAt': new Date(),
      },
      $addToSet: {
        'internalAudit.riskFlags':
          verificationStatus === 'rejected' ? 'rejected_by_admin' : 'approved_by_admin',
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select('displayName fullName affiliateCode status verificationStatus onboardingCompletedAt createdAt')
    .lean();

  if (!affiliate) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Affiliate not found');
  }

  logger.info(
    {
      requestId: auditRequestId,
      event: 'admin_affiliate_approval_updated',
      affiliateId: normalizedAffiliateId,
      verificationStatus,
      adminTelegramUserId,
    },
    'Admin affiliate approval updated',
  );

  return affiliate;
};

const coordinatorStatusByRequestStatus = Object.freeze({
  pending: 'unreviewed',
  reviewing: 'reviewing',
  assigned: 'contacted',
  completed: 'resolved',
});

const allowedRequestStatusTransitions = Object.freeze({
  pending: ['reviewing', 'assigned', 'completed'],
  reviewing: ['assigned', 'completed'],
  assigned: ['reviewing', 'completed'],
  completed: [],
});

export const updateRequestManagementStatus = async ({
  requestPostId,
  status,
  adminTelegramUserId,
  auditRequestId,
}) => {
  const normalizedRequestPostId = assertValidObjectId(requestPostId, 'Request id');

  if (!Object.hasOwn(coordinatorStatusByRequestStatus, status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid request status');
  }

  const existingRequest = await RequestPost.findById(normalizedRequestPostId)
    .select('status')
    .lean();

  if (!existingRequest) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Request not found');
  }

  if (existingRequest.status === status) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Request already has that status');
  }

  if (!allowedRequestStatusTransitions[existingRequest.status]?.includes(status)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid request status transition from ${existingRequest.status} to ${status}`,
    );
  }

  const request = await RequestPost.findByIdAndUpdate(
    normalizedRequestPostId,
    {
      $set: {
        status,
        coordinatorStatus: coordinatorStatusByRequestStatus[status],
        assignedCoordinatorId:
          status === 'reviewing' || status === 'assigned' ? adminTelegramUserId : '',
        lastCoordinatorActionAt: new Date(),
        'internalAudit.lastReviewedAt': new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select('outfitType style location budgetRange dueDate status coordinatorStatus createdAt')
    .lean();

  logger.info(
    {
      requestId: auditRequestId,
      event: 'admin_request_status_updated',
      requestPostId: normalizedRequestPostId,
      status,
      adminTelegramUserId,
    },
    'Admin request status updated',
  );

  return request;
};
