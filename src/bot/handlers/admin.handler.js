import {
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
          `${index + 1}. ${tailor.publicName}\nID: ${tailor._id}\nCity: ${tailor.location?.city ?? 'N/A'}\nPhone: ${tailor.phoneNumber || 'Not set'}\nTelegram: ${tailor.userId?.telegramUsername ? `@${tailor.userId.telegramUsername}` : 'Not set'}\nVerification: ${tailor.verificationStatus}\nStatus: ${tailor.status}`,
      )
      .join('\n\n');

    await ctx.reply(`Recent tailors:\n\n${summary}`);
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
          `${index + 1}. ${affiliate.displayName}\nID: ${affiliate._id}\nAffiliate code: ${affiliate.affiliateCode}\nPhone: ${affiliate.phoneNumber || 'Not set'}\nTelegram: ${affiliate.userId?.telegramUsername ? `@${affiliate.userId.telegramUsername}` : 'Not set'}\nVerification: ${affiliate.verificationStatus}\nStatus: ${affiliate.status}`,
      )
      .join('\n\n');

    await ctx.reply(`Recent affiliates:\n\n${summary}`);
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
