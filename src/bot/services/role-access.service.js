import { AffiliateProfile } from '../../models/affiliate-profile.model.js';
import { ClientProfile } from '../../models/client-profile.model.js';
import { TailorProfile } from '../../models/tailor-profile.model.js';
import { User } from '../../models/user.model.js';
import { isTelegramAdmin } from './admin-access.service.js';

const roleMessages = Object.freeze({
  blocked: 'Your Sewmaxx account is unavailable right now. Please contact support if you need help.',
  client: 'This option is for clients. Use /client to set up your client profile first.',
  tailor: 'This option is for tailors. Use /tailor to set up your tailor profile first.',
  affiliate: 'This option is for affiliates. Use /affiliate to set up your affiliate profile first.',
  admin: 'Unauthorized.',
});

const getTelegramUserId = (ctx) => String(ctx.from?.id ?? '');

export const getBotRoleAccessState = async (ctx) => {
  if (ctx.state?.botRoleAccessState) {
    return ctx.state.botRoleAccessState;
  }

  const telegramUserId = getTelegramUserId(ctx);
  const user = await User.findOne({ telegramUserId }).select('_id status roles primaryRole').lean();

  if (!user) {
    const state = {
      telegramUserId,
      user: null,
      hasClientProfile: false,
      hasTailorProfile: false,
      hasAffiliateProfile: false,
      isAdmin: isTelegramAdmin(telegramUserId),
      isBlocked: false,
    };
    ctx.state.botRoleAccessState = state;
    return state;
  }

  const [clientProfile, tailorProfile, affiliateProfile] = await Promise.all([
    ClientProfile.findOne({ userId: user._id }).select('_id').lean(),
    TailorProfile.findOne({ userId: user._id }).select('_id').lean(),
    AffiliateProfile.findOne({ userId: user._id }).select('_id').lean(),
  ]);

  const state = {
    telegramUserId,
    user,
    hasClientProfile: Boolean(clientProfile),
    hasTailorProfile: Boolean(tailorProfile),
    hasAffiliateProfile: Boolean(affiliateProfile),
    isAdmin: isTelegramAdmin(telegramUserId),
    isBlocked: user.status === 'blocked',
  };

  ctx.state.botRoleAccessState = state;
  return state;
};

const denyRoleAccess = async (ctx, message, sendReplyMessage) => {
  if (ctx.callbackQuery && ctx.answerCbQuery) {
    await ctx.answerCbQuery(message);
  }

  if (sendReplyMessage && ctx.reply) {
    await ctx.reply(message);
  }
};

const roleCheckers = Object.freeze({
  client: (state) => state.hasClientProfile,
  tailor: (state) => state.hasTailorProfile,
  affiliate: (state) => state.hasAffiliateProfile,
  admin: (state) => state.isAdmin,
});

export const ensureBotRoleAccess = async (ctx, role, options = {}) => {
  const state = await getBotRoleAccessState(ctx);
  const sendReplyMessage = options.sendReplyMessage ?? !Boolean(ctx.callbackQuery);

  if (state.isBlocked) {
    await denyRoleAccess(ctx, roleMessages.blocked, sendReplyMessage);
    return false;
  }

  const hasAccess = roleCheckers[role]?.(state) ?? false;

  if (hasAccess) {
    return true;
  }

  await denyRoleAccess(ctx, roleMessages[role] ?? 'Unauthorized.', sendReplyMessage);
  return false;
};
