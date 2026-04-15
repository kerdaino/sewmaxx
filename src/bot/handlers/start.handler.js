import { buildStartRoleKeyboard } from '../keyboards/start.keyboard.js';
import { startAffiliateOnboarding } from './affiliate-onboarding.handler.js';
import { startClientOnboarding } from './client-onboarding.handler.js';
import { startTailorOnboarding } from './tailor-onboarding.handler.js';
import {
  buildResumeMessage,
  getStartFlowState,
  validateStartReferralCode,
} from '../services/start-flow.service.js';
import { trackReferral } from '../../services/referral.service.js';

export const handleStartCommand = async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  const referralCode = ctx.state.startPayload?.trim();

  if (ctx.session.onboardingStartInFlight) {
    await ctx.reply('Your onboarding menu is already open. Choose a role below to continue.', buildStartRoleKeyboard());
    return;
  }

  ctx.session.onboardingStartInFlight = true;

  try {
    const flowState = await getStartFlowState(ctx);

    ctx.session.activeDomain = 'onboarding';
    ctx.session.lastCommand = '/start';
    ctx.session.selectedRole = null;

    let referralMessage = '';

    if (referralCode && telegramUserId) {
      const referral = await validateStartReferralCode({
        referralCode,
        telegramUserId,
      }).catch(() => ({
        isValid: false,
        reason: 'invalid',
      }));

      if (referral.isValid) {
        ctx.session.pendingReferralCode = referral.referralCode;
        referralMessage = '\nReferral applied. Continue by choosing your role.';
      } else if (referral.reason === 'self_referral') {
        ctx.session.pendingReferralCode = null;
        referralMessage = '\nYou cannot use your own affiliate referral link.';
      } else {
        ctx.session.pendingReferralCode = null;
        referralMessage = '\nThat referral link is invalid or unavailable, but you can still continue.';
      }
    } else {
      ctx.session.pendingReferralCode = null;
    }

    const resumeMessage = buildResumeMessage(flowState);
    const introMessage =
      resumeMessage ??
      'Welcome to Sewmaxx. We help clients, tailors, and affiliates get started quickly.';

    await ctx.reply(
      `${introMessage}\nChoose your role to continue.${referralMessage}`,
      buildStartRoleKeyboard(),
    );
  } finally {
    ctx.session.onboardingStartInFlight = false;
  }
};

export const handleStartRoleSelection = async (ctx) => {
  const role = ctx.match?.[1];

  if (!['client', 'tailor', 'affiliate'].includes(role)) {
    await ctx.answerCbQuery('Invalid role selection');
    return;
  }

  ctx.session.activeDomain = 'onboarding';
  ctx.session.lastCommand = '/start';
  ctx.session.selectedRole = role;
  await ctx.answerCbQuery();

  const flowState = await getStartFlowState(ctx);
  const hasExistingRole =
    (role === 'client' && flowState.profiles.clientProfile) ||
    (role === 'tailor' && flowState.profiles.tailorProfile) ||
    (role === 'affiliate' && flowState.profiles.affiliateProfile);

  let referralText = '';

  if (ctx.session.pendingReferralCode && role === 'tailor') {
    await trackReferral({
      referralCode: ctx.session.pendingReferralCode,
      referredTelegramUserId: String(ctx.from?.id ?? ''),
      referredUserType: role,
      source: 'telegram_start',
    });

    referralText = '\nYour referral has been linked successfully.';
    ctx.session.pendingReferralCode = null;
  } else if (role === 'affiliate') {
    ctx.session.pendingReferralCode = null;
  }

  const replyText = hasExistingRole
    ? `Welcome back. Your ${role} profile already exists, so we can resume from there.${referralText}`
    : role === 'client'
      ? `Client selected. We can continue with client onboarding next.${referralText}`
      : role === 'tailor'
        ? `Tailor selected. We can continue with tailor onboarding next.${referralText}`
        : 'Affiliate selected. We can continue with affiliate onboarding next.';

  await ctx.editMessageText(replyText);

  if (role === 'affiliate') {
    await startAffiliateOnboarding(ctx);
    return;
  }

  if (role === 'client') {
    await startClientOnboarding(ctx);
    return;
  }

  if (role === 'tailor') {
    await startTailorOnboarding(ctx);
  }
};
