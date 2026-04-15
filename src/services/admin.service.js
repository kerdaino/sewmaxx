import { AffiliateProfile } from '../models/affiliate-profile.model.js';
import { RequestPost } from '../models/request-post.model.js';
import { SearchSession } from '../models/search-session.model.js';
import { TailorProfile } from '../models/tailor-profile.model.js';
import { logger } from '../config/logger.js';

export const listRecentAffiliates = async ({ limit, requestId }) => {
  const affiliates = await AffiliateProfile.find({})
    .select('displayName fullName affiliateCode status verificationStatus onboardingCompletedAt createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  logger.info(
    { requestId, event: 'admin_list_recent_affiliates', resultCount: affiliates.length },
    'Admin query executed',
  );

  return affiliates;
};

export const listRecentClientRequests = async ({ limit, requestId }) => {
  const requests = await RequestPost.find({})
    .select('outfitType style location budgetRange dueDate status coordinatorStatus createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  logger.info(
    { requestId, event: 'admin_list_recent_client_requests', resultCount: requests.length },
    'Admin query executed',
  );

  return requests;
};

export const listRecentTailorSignups = async ({ limit, requestId }) => {
  const tailors = await TailorProfile.find({})
    .select('publicName businessName location specialties status verificationStatus onboardingCompletedAt createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  logger.info(
    { requestId, event: 'admin_list_recent_tailor_signups', resultCount: tailors.length },
    'Admin query executed',
  );

  return tailors;
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
