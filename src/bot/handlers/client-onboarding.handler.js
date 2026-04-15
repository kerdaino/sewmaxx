import { buildClientOnboardingControls } from '../keyboards/client-onboarding.keyboard.js';
import {
  buildClientSummary,
  completeClientOnboarding,
  getExistingClientProfile,
} from '../services/client-onboarding.service.js';
import {
  validateClientArea,
  validateClientCity,
  validateClientCountry,
  validateClientFullName,
} from '../validators/client-onboarding.validator.js';

const resetClientDraft = (ctx) => {
  ctx.session.onboardingFlow = 'client';
  ctx.session.activeDomain = 'onboarding';
  ctx.session.selectedRole = 'client';
  ctx.session.onboardingDraft = {};
};

export const startClientOnboarding = async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  const existingClient = await getExistingClientProfile(telegramUserId);

  if (existingClient?.onboardingCompletedAt) {
    ctx.session.onboardingFlow = null;
    ctx.session.onboardingStep = null;
    ctx.session.onboardingDraft = null;
    ctx.session.selectedRole = 'client';

    await ctx.reply(
      buildClientSummary({
        client: existingClient,
        usedReferral: Boolean(existingClient.referredByAffiliateProfileId),
      }),
      buildClientOnboardingControls(),
    );
    return;
  }

  resetClientDraft(ctx);
  ctx.session.onboardingStep = 'client_full_name';

  await ctx.reply('Let’s set up your client profile. What is your full name?');
};

export const restartClientOnboarding = async (ctx) => {
  resetClientDraft(ctx);
  ctx.session.onboardingStep = 'client_full_name';

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Client onboarding restarted');
  }

  await ctx.reply('Client onboarding restarted. What is your full name?');
};

export const handleClientFullNameInput = async (ctx) => {
  const result = validateClientFullName(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    fullName: result.value,
  };
  ctx.session.onboardingStep = 'client_country';

  await ctx.reply('Which country are you in?');
  return true;
};

export const handleClientCountryInput = async (ctx) => {
  const result = validateClientCountry(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    country: result.value,
  };
  ctx.session.onboardingStep = 'client_city';

  await ctx.reply('Which city are you in?');
  return true;
};

export const handleClientCityInput = async (ctx) => {
  const result = validateClientCity(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    city: result.value,
  };
  ctx.session.onboardingStep = 'client_area';

  await ctx.reply('What area or full location should we save for you?');
  return true;
};

export const handleClientAreaInput = async (ctx) => {
  const result = validateClientArea(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    area: result.value,
  };

  await finalizeClientOnboarding(ctx);
  return true;
};

const finalizeClientOnboarding = async (ctx) => {
  const draft = ctx.session.onboardingDraft ?? {};

  if (!draft.fullName || !draft.country || !draft.city || !draft.area) {
    await startClientOnboarding(ctx);
    return;
  }

  const client = await completeClientOnboarding({
    telegramUserId: String(ctx.from?.id ?? ''),
    telegramUsername: ctx.from?.username ?? '',
    fullName: draft.fullName,
    country: draft.country,
    city: draft.city,
    area: draft.area,
    referralCode: ctx.session.pendingReferralCode ?? undefined,
  });

  const usedReferral = Boolean(ctx.session.pendingReferralCode);
  ctx.session.onboardingFlow = null;
  ctx.session.onboardingStep = null;
  ctx.session.onboardingDraft = null;
  ctx.session.pendingReferralCode = null;
  ctx.session.selectedRole = 'client';

  await ctx.reply(
    buildClientSummary({ client, usedReferral }),
    buildClientOnboardingControls(),
  );
};
