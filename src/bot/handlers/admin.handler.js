import {
  getAdminAffiliateReview,
  getAdminTailorReview,
  listRecentAffiliates,
  listRecentClientRequests,
  listRecentTailorSignups,
  updateAffiliateApprovalStatus,
  updateRequestManagementStatus,
  updateTailorApprovalStatus,
} from '../../services/admin.service.js';
import { logger } from '../../config/logger.js';
import { serializeErrorForLog } from '../../utils/error-log.js';
import { ApiError } from '../../utils/api-error.js';
import { isValidObjectId } from '../../utils/object-id.js';
import { isTelegramAdmin } from '../services/admin-access.service.js';

const ADMIN_LIST_LIMIT = 5;

const getTelegramUserId = (ctx) => String(ctx.from?.id ?? '');

const ensureAdminAccess = async (ctx) => {
  if (!isTelegramAdmin(getTelegramUserId(ctx))) {
    await ctx.reply('Unauthorized.');
    return false;
  }

  return true;
};

const getCommandParts = (ctx) =>
  String(ctx.message?.text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const buildAuditRequestId = (ctx) => `tg-admin-${getTelegramUserId(ctx)}`;

const ensureValidCommandObjectId = (value, label) => {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `${label} is invalid`);
  }

  return value.trim();
};

const buildTailorFileReference = (asset) => asset?.telegramFileId || asset?.assetKey || '';
const buildAffiliateFileReference = (asset) => asset?.telegramFileId || '';

const sendAdminTailorAsset = async (ctx, { asset, caption, fallbackLabel }) => {
  const fileReference = buildTailorFileReference(asset);

  if (!fileReference) {
    await ctx.reply(`${fallbackLabel}: not submitted`);
    return;
  }

  try {
    if (asset?.telegramFileType === 'document') {
      await ctx.replyWithDocument(fileReference, {
        caption,
      });
      return;
    }

    await ctx.replyWithPhoto(fileReference, {
      caption,
    });
  } catch (error) {
    logger.warn(
      {
        event: 'admin_tailor_asset_send_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
        fileReference,
        fallbackLabel,
      },
      'Admin tailor asset send failed',
    );
    await ctx.reply(`${fallbackLabel}: ${fileReference}`);
  }
};

const sendAdminTailorReviewAssets = async (ctx, tailor) => {
  await sendAdminTailorAsset(ctx, {
    asset: tailor.kyc?.idDocument,
    caption: `Tailor ID upload\n${tailor.publicName || tailor.fullName}`,
    fallbackLabel: 'ID file reference',
  });

  await sendAdminTailorAsset(ctx, {
    asset: tailor.kyc?.selfieWithId,
    caption: `Tailor selfie with ID\n${tailor.publicName || tailor.fullName}`,
    fallbackLabel: 'Selfie with ID reference',
  });

  await sendAdminTailorAsset(ctx, {
    asset: tailor.kyc?.workplaceImage,
    caption: `Tailor workplace image\n${tailor.publicName || tailor.fullName}`,
    fallbackLabel: 'Workplace file reference',
  });

  const portfolio = Array.isArray(tailor.portfolio) ? tailor.portfolio : [];

  if (portfolio.length === 0) {
    await ctx.reply('Portfolio uploads: none submitted');
    return;
  }

  for (const [index, item] of portfolio.entries()) {
    await sendAdminTailorAsset(ctx, {
      asset: item,
      caption: `Portfolio upload ${index + 1} of ${portfolio.length}\n${tailor.publicName || tailor.fullName}`,
      fallbackLabel: `Portfolio file ${index + 1}`,
    });
  }
};

const sendAdminAffiliateAsset = async (ctx, { asset, caption, fallbackLabel }) => {
  const fileReference = buildAffiliateFileReference(asset);

  if (!fileReference) {
    await ctx.reply(`${fallbackLabel}: not submitted`);
    return;
  }

  try {
    if (asset?.telegramFileType === 'document') {
      await ctx.replyWithDocument(fileReference, {
        caption,
      });
      return;
    }

    await ctx.replyWithPhoto(fileReference, {
      caption,
    });
  } catch (error) {
    logger.warn(
      {
        event: 'admin_affiliate_asset_send_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
        fileReference,
        fallbackLabel,
      },
      'Admin affiliate asset send failed',
    );
    await ctx.reply(`${fallbackLabel}: ${fileReference}`);
  }
};

const sendAdminAffiliateReviewAssets = async (ctx, affiliate) => {
  await sendAdminAffiliateAsset(ctx, {
    asset: affiliate.kycDetails?.idDocument,
    caption: `Affiliate ID upload\n${affiliate.displayName || affiliate.fullName}`,
    fallbackLabel: 'Affiliate ID file reference',
  });

  await sendAdminAffiliateAsset(ctx, {
    asset: affiliate.kycDetails?.selfieWithId,
    caption: `Affiliate selfie with ID\n${affiliate.displayName || affiliate.fullName}`,
    fallbackLabel: 'Affiliate selfie with ID reference',
  });
};

export const handleAdminTailorsCommand = async (ctx) => {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  try {
    const tailors = await listRecentTailorSignups({
      limit: ADMIN_LIST_LIMIT,
      requestId: buildAuditRequestId(ctx),
    });

    if (tailors.length === 0) {
      await ctx.reply('No tailor records found.');
      return;
    }

    const summary = tailors
      .map(
        (tailor, index) =>
          `${index + 1}. ${tailor.publicName}\nID: ${tailor._id}\nCity: ${tailor.location?.city ?? 'N/A'}\nPhone: ${tailor.phoneNumber || 'Not set'}\nTelegram: ${tailor.userId?.telegramUsername ? `@${tailor.userId.telegramUsername}` : 'Not set'}\nVerification: ${tailor.verificationStatus}\nStatus: ${tailor.status}\nPortfolio uploads: ${tailor.portfolio?.length ?? 0}\nID submitted: ${tailor.kyc?.idDocument?.telegramFileId ? 'Yes' : 'No'}\nSelfie with ID: ${tailor.kyc?.selfieWithId?.telegramFileId ? 'Yes' : 'No'}\nWorkplace image: ${tailor.kyc?.workplaceImage?.telegramFileId ? 'Yes' : 'No'}`,
      )
      .join('\n\n');

    await ctx.reply(`Recent tailors:\n\n${summary}\n\nUse /admin_tailor_detail <id> for the private review view.`);
  } catch (error) {
    logger.error(
      {
        event: 'admin_tailors_command_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
      },
      'Admin tailor listing failed',
    );
    await ctx.reply('We could not load tailors right now.');
  }
};

export const handleAdminAffiliatesCommand = async (ctx) => {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  try {
    const affiliates = await listRecentAffiliates({
      limit: ADMIN_LIST_LIMIT,
      requestId: buildAuditRequestId(ctx),
    });

    if (affiliates.length === 0) {
      await ctx.reply('No affiliate records found.');
      return;
    }

    const summary = affiliates
      .map(
        (affiliate, index) =>
          `${index + 1}. ${affiliate.displayName}\nID: ${affiliate._id}\nAffiliate code: ${affiliate.affiliateCode}\nPhone: ${affiliate.phoneNumber || affiliate.kycDetails?.legalPhoneNumber || 'Not set'}\nTelegram: ${affiliate.userId?.telegramUsername ? `@${affiliate.userId.telegramUsername}` : 'Not set'}\nVerification: ${affiliate.verificationStatus}\nStatus: ${affiliate.status}\nCountry: ${affiliate.kycDetails?.country || affiliate.location?.country || 'Not set'}\nCity: ${affiliate.kycDetails?.city || affiliate.location?.city || 'Not set'}\nID submitted: ${affiliate.kycDetails?.idDocument?.telegramFileId ? 'Yes' : 'No'}\nSelfie with ID submitted: ${affiliate.kycDetails?.selfieWithId?.telegramFileId ? 'Yes' : 'No'}`,
      )
      .join('\n\n');

    await ctx.reply(`Recent affiliates:\n\n${summary}\n\nUse /admin_affiliate_detail <id> for the private review view.`);
  } catch (error) {
    logger.error(
      {
        event: 'admin_affiliates_command_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
      },
      'Admin affiliate listing failed',
    );
    await ctx.reply('We could not load affiliates right now.');
  }
};

export const handleAdminTailorDetailCommand = async (ctx) => {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  const [, tailorId] = getCommandParts(ctx);

  if (!tailorId) {
    await ctx.reply('Usage: /admin_tailor_detail <id>');
    return;
  }

  try {
    const tailor = await getAdminTailorReview({
      tailorId: ensureValidCommandObjectId(tailorId, 'Tailor id'),
      requestId: buildAuditRequestId(ctx),
    });

    const portfolioLines = (tailor.portfolio ?? [])
      .map(
        (item, index) =>
          `${index + 1}. ${item.telegramFileType}:${item.telegramFileId || item.assetKey || 'missing-file-id'}`,
      )
      .join('\n');

    await ctx.reply(
      [
        'Tailor private review',
        '',
        `ID: ${tailor._id}`,
        `Full name: ${tailor.fullName}`,
        `Public name: ${tailor.publicName}`,
        `Business name: ${tailor.businessName}`,
        `Phone: ${tailor.phoneNumber || 'Not set'}`,
        `Telegram: ${tailor.userId?.telegramUsername ? `@${tailor.userId.telegramUsername}` : 'Not set'}`,
        `Country: ${tailor.location?.country ?? 'Not set'}`,
        `City: ${tailor.location?.city ?? 'Not set'}`,
        `Work address: ${tailor.workAddress || 'Not set'}`,
        `Specialties: ${tailor.specialties?.join(', ') || 'Not set'}`,
        `Terms reviewed: ${tailor.onboardingAgreement?.termsReviewedAt ? 'Yes' : 'No'}`,
        `Policies accepted: ${tailor.onboardingAgreement?.policiesAcceptedAt ? 'Yes' : 'No'}`,
        `Pricing accepted: ${tailor.onboardingAgreement?.pricingAcceptedAt ? 'Yes' : 'No'}`,
        `ID file status: ${tailor.kyc?.idDocument?.telegramFileId ? 'Available below' : 'Not submitted'}`,
        `Selfie with ID status: ${tailor.kyc?.selfieWithId?.telegramFileId ? 'Available below' : 'Not submitted'}`,
        `Workplace file status: ${tailor.kyc?.workplaceImage?.telegramFileId ? 'Available below' : 'Not submitted'}`,
        `Portfolio files:\n${portfolioLines || 'None'}`,
      ].join('\n'),
    );
    await sendAdminTailorReviewAssets(ctx, tailor);
  } catch (error) {
    logger.error(
      {
        event: 'admin_tailor_detail_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
        tailorId,
      },
      'Admin tailor detail failed',
    );
    await ctx.reply('We could not load that tailor review right now. Check the ID and try again.');
  }
};

export const handleAdminAffiliateDetailCommand = async (ctx) => {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  const [, affiliateId] = getCommandParts(ctx);

  if (!affiliateId) {
    await ctx.reply('Usage: /admin_affiliate_detail <id>');
    return;
  }

  try {
    const affiliate = await getAdminAffiliateReview({
      affiliateId: ensureValidCommandObjectId(affiliateId, 'Affiliate id'),
      requestId: buildAuditRequestId(ctx),
    });

    await ctx.reply(
      [
        'Affiliate private review',
        '',
        `ID: ${affiliate._id}`,
        `Full name: ${affiliate.fullName}`,
        `Display name: ${affiliate.displayName}`,
        `Affiliate code: ${affiliate.affiliateCode}`,
        `Phone: ${affiliate.phoneNumber || affiliate.kycDetails?.legalPhoneNumber || 'Not set'}`,
        `Telegram: ${affiliate.userId?.telegramUsername ? `@${affiliate.userId.telegramUsername}` : 'Not set'}`,
        `Country: ${affiliate.kycDetails?.country || affiliate.location?.country || 'Not set'}`,
        `City: ${affiliate.kycDetails?.city || affiliate.location?.city || 'Not set'}`,
        `Verification: ${affiliate.verificationStatus}`,
        `Status: ${affiliate.status}`,
        `ID file status: ${affiliate.kycDetails?.idDocument?.telegramFileId ? 'Available below' : 'Not submitted'}`,
        `Selfie with ID status: ${affiliate.kycDetails?.selfieWithId?.telegramFileId ? 'Available below' : 'Not submitted'}`,
      ].join('\n'),
    );
    await sendAdminAffiliateReviewAssets(ctx, affiliate);
  } catch (error) {
    logger.error(
      {
        event: 'admin_affiliate_detail_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
        affiliateId,
      },
      'Admin affiliate detail failed',
    );
    await ctx.reply('We could not load that affiliate review right now. Check the ID and try again.');
  }
};

export const handleApproveTailorCommand = async (ctx) => {
  await handleTailorApprovalCommand(ctx, 'approved');
};

export const handleRejectTailorCommand = async (ctx) => {
  await handleTailorApprovalCommand(ctx, 'rejected');
};

export const handleApproveAffiliateCommand = async (ctx) => {
  await handleAffiliateApprovalCommand(ctx, 'approved');
};

export const handleRejectAffiliateCommand = async (ctx) => {
  await handleAffiliateApprovalCommand(ctx, 'rejected');
};

const handleTailorApprovalCommand = async (ctx, verificationStatus) => {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  const [, tailorId] = getCommandParts(ctx);

  if (!tailorId) {
    await ctx.reply(`Usage: /${verificationStatus === 'approved' ? 'approve_tailor' : 'reject_tailor'} <id>`);
    return;
  }

  try {
    const normalizedTailorId = ensureValidCommandObjectId(tailorId, 'Tailor id');
    const tailor = await updateTailorApprovalStatus({
      tailorId: normalizedTailorId,
      verificationStatus,
      adminTelegramUserId: getTelegramUserId(ctx),
      auditRequestId: buildAuditRequestId(ctx),
    });

    await ctx.reply(
      `Tailor updated.\n\nID: ${tailor._id}\nVerification: ${tailor.verificationStatus}\nStatus: ${tailor.status}`,
    );
  } catch (error) {
    logger.error(
      {
        event: 'admin_tailor_update_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
        tailorId,
        verificationStatus,
      },
      'Admin tailor update failed',
    );
    await ctx.reply('We could not update that tailor right now. Check the ID and try again.');
  }
};

const handleAffiliateApprovalCommand = async (ctx, verificationStatus) => {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  const [, affiliateId] = getCommandParts(ctx);

  if (!affiliateId) {
    await ctx.reply(
      `Usage: /${verificationStatus === 'approved' ? 'approve_affiliate' : 'reject_affiliate'} <id>`,
    );
    return;
  }

  try {
    const normalizedAffiliateId = ensureValidCommandObjectId(affiliateId, 'Affiliate id');
    const affiliate = await updateAffiliateApprovalStatus({
      affiliateId: normalizedAffiliateId,
      verificationStatus,
      adminTelegramUserId: getTelegramUserId(ctx),
      auditRequestId: buildAuditRequestId(ctx),
    });

    await ctx.reply(
      `Affiliate updated.\n\nID: ${affiliate._id}\nAffiliate code: ${affiliate.affiliateCode}\nVerification: ${affiliate.verificationStatus}\nStatus: ${affiliate.status}`,
    );
  } catch (error) {
    logger.error(
      {
        event: 'admin_affiliate_update_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
        affiliateId,
        verificationStatus,
      },
      'Admin affiliate update failed',
    );
    await ctx.reply('We could not update that affiliate right now. Check the ID and try again.');
  }
};

export const handleAdminRequestsCommand = async (ctx) => {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  try {
    const requests = await listRecentClientRequests({
      limit: ADMIN_LIST_LIMIT,
      requestId: buildAuditRequestId(ctx),
    });

    if (requests.length === 0) {
      await ctx.reply('No request records found.');
      return;
    }

    const summary = requests
      .map(
        (request, index) =>
          `${index + 1}. ${request.style || request.outfitType}\nID: ${request._id}\nClient: ${request.clientProfileId?.fullName ?? 'Unknown'}\nPhone: ${request.clientProfileId?.phoneNumber || 'Not set'}\nTelegram: ${request.userId?.telegramUsername ? `@${request.userId.telegramUsername}` : 'Not set'}\nCity: ${request.location?.city ?? 'N/A'}\nStatus: ${request.status}\nCoordinator: ${request.coordinatorStatus}`,
      )
      .join('\n\n');

    await ctx.reply(`Recent requests:\n\n${summary}`);
  } catch (error) {
    logger.error(
      {
        event: 'admin_requests_command_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
      },
      'Admin request listing failed',
    );
    await ctx.reply('We could not load requests right now.');
  }
};

export const handleUpdateRequestCommand = async (ctx) => {
  if (!(await ensureAdminAccess(ctx))) {
    return;
  }

  const [, requestId, status] = getCommandParts(ctx);

  if (!requestId || !status) {
    await ctx.reply('Usage: /update_request <id> <pending|reviewing|assigned|completed>');
    return;
  }

  try {
    const normalizedRequestId = ensureValidCommandObjectId(requestId, 'Request id');
    const request = await updateRequestManagementStatus({
      requestPostId: normalizedRequestId,
      status,
      adminTelegramUserId: getTelegramUserId(ctx),
      auditRequestId: buildAuditRequestId(ctx),
    });

    await ctx.reply(
      `Request updated.\n\nID: ${request._id}\nStatus: ${request.status}\nCoordinator: ${request.coordinatorStatus}`,
    );
  } catch (error) {
    logger.error(
      {
        event: 'admin_request_update_failed',
        error: serializeErrorForLog(error),
        telegramUserId: getTelegramUserId(ctx),
        requestId,
        status,
      },
      'Admin request update failed',
    );
    await ctx.reply('We could not update that request right now. Check the request ID and status, then try again.');
  }
};
