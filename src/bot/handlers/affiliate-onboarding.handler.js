import {
  buildAffiliateDisplayNameKeyboard,
  buildAffiliateSummaryKeyboard,
} from '../keyboards/affiliate-onboarding.keyboard.js';
import {
  buildAffiliateSummary,
  completeAffiliateOnboarding,
  getExistingAffiliateProfile,
} from '../services/affiliate-onboarding.service.js';
import {
  validateAffiliateDisplayName,
  validateAffiliateFullName,
} from '../validators/affiliate-onboarding.validator.js';
import { buildTelegramReferralLink } from '../utils/build-telegram-referral-link.js';

const resetAffiliateDraft = (ctx) => {
  ctx.session.onboardingFlow = 'affiliate';
  ctx.session.activeDomain = 'onboarding';
  ctx.session.selectedRole = 'affiliate';
  ctx.session.onboardingDraft = {};
};

export const startAffiliateOnboarding = async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  const existingAffiliate = await getExistingAffiliateProfile(telegramUserId);

  if (existingAffiliate?.onboardingCompletedAt) {
    ctx.session.onboardingFlow = null;
    ctx.session.onboardingStep = null;
    ctx.session.onboardingDraft = null;
    ctx.session.selectedRole = 'affiliate';
    const referralLink = buildTelegramReferralLink(existingAffiliate.affiliateCode);

    await ctx.reply(
      buildAffiliateSummary({ affiliate: existingAffiliate, referralLink }),
      buildAffiliateSummaryKeyboard(referralLink),
    );
    return;
  }

  resetAffiliateDraft(ctx);
  ctx.session.onboardingStep = 'affiliate_full_name';

  await ctx.reply('Let’s set up your affiliate profile. What is your full name?');
};

export const handleAffiliateFullNameInput = async (ctx) => {
  const result = validateAffiliateFullName(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    fullName: result.value,
  };
  ctx.session.onboardingStep = 'affiliate_display_name';

  await ctx.reply(
    'What display name or brand name should people see? You can also use your full name.',
    buildAffiliateDisplayNameKeyboard(),
  );

  return true;
};

export const handleAffiliateUseFullName = async (ctx) => {
  const fullName = ctx.session.onboardingDraft?.fullName;

  if (!fullName) {
    await ctx.answerCbQuery('Please enter your full name first');
    await startAffiliateOnboarding(ctx);
    return;
  }

  await ctx.answerCbQuery();
  await finalizeAffiliateOnboarding(ctx, fullName);
};

export const handleAffiliateDisplayNameInput = async (ctx) => {
  const result = validateAffiliateDisplayName(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message, buildAffiliateDisplayNameKeyboard());
    return true;
  }

  await finalizeAffiliateOnboarding(ctx, result.value);
  return true;
};

export const restartAffiliateOnboarding = async (ctx) => {
  resetAffiliateDraft(ctx);
  ctx.session.onboardingStep = 'affiliate_full_name';
  ctx.session.pendingReferralCode = null;

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Affiliate onboarding restarted');
  }

  await ctx.reply('Affiliate onboarding restarted. What is your full name?');
};

const finalizeAffiliateOnboarding = async (ctx, displayName) => {
  const fullName = ctx.session.onboardingDraft?.fullName;

  if (!fullName) {
    await startAffiliateOnboarding(ctx);
    return;
  }

  const result = await completeAffiliateOnboarding({
    telegramUserId: String(ctx.from?.id ?? ''),
    telegramUsername: ctx.from?.username ?? '',
    fullName,
    displayName,
  });

  ctx.session.onboardingFlow = null;
  ctx.session.onboardingStep = null;
  ctx.session.onboardingDraft = null;
  ctx.session.selectedRole = 'affiliate';
  ctx.session.pendingReferralCode = null;

  await ctx.reply(
    buildAffiliateSummary(result),
    buildAffiliateSummaryKeyboard(result.referralLink),
  );
};
