import {
  buildTailorOnboardingControls,
  buildTailorPublicNameKeyboard,
} from '../keyboards/tailor-onboarding.keyboard.js';
import {
  buildTailorSummary,
  completeTailorOnboarding,
  getExistingTailorProfile,
} from '../services/tailor-onboarding.service.js';
import {
  validateTailorBudgetRange,
  validateTailorBusinessName,
  validateTailorCity,
  validateTailorCountry,
  validateTailorFullName,
  validateTailorPublicName,
  validateTailorSpecialties,
  validateTailorWorkAddress,
} from '../validators/tailor-onboarding.validator.js';
import { logger } from '../../config/logger.js';
import { serializeErrorForLog } from '../../utils/error-log.js';

const resetTailorDraft = (ctx) => {
  ctx.session.onboardingFlow = 'tailor';
  ctx.session.activeDomain = 'onboarding';
  ctx.session.selectedRole = 'tailor';
  ctx.session.onboardingDraft = {};
};

export const startTailorOnboarding = async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  const existingTailor = await getExistingTailorProfile(telegramUserId);

  if (existingTailor?.onboardingCompletedAt) {
    ctx.session.onboardingFlow = null;
    ctx.session.onboardingStep = null;
    ctx.session.onboardingDraft = null;
    ctx.session.selectedRole = 'tailor';
    ctx.session.pendingReferralCode = null;

    await ctx.reply(
      buildTailorSummary({ tailor: existingTailor }),
      buildTailorOnboardingControls(),
    );
    return;
  }

  resetTailorDraft(ctx);
  ctx.session.onboardingStep = 'tailor_full_name';

  await ctx.reply('Let’s set up your tailor profile. What is your full name?');
};

export const restartTailorOnboarding = async (ctx) => {
  resetTailorDraft(ctx);
  ctx.session.onboardingStep = 'tailor_full_name';

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Tailor onboarding restarted');
  }

  await ctx.reply('Tailor onboarding restarted. What is your full name?');
};

export const handleTailorFullNameInput = async (ctx) => {
  const result = validateTailorFullName(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    fullName: result.value,
  };
  ctx.session.onboardingStep = 'tailor_business_name';

  await ctx.reply('What is your business name?');
  return true;
};

export const handleTailorBusinessNameInput = async (ctx) => {
  const result = validateTailorBusinessName(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    businessName: result.value,
  };
  ctx.session.onboardingStep = 'tailor_public_name';

  await ctx.reply(
    'What public name or display username should clients see?',
    buildTailorPublicNameKeyboard(),
  );
  return true;
};

export const handleTailorUseBusinessName = async (ctx) => {
  const businessName = ctx.session.onboardingDraft?.businessName;

  if (!businessName) {
    await ctx.answerCbQuery('Please enter your business name first');
    await startTailorOnboarding(ctx);
    return;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    publicName: businessName,
  };
  ctx.session.onboardingStep = 'tailor_country';

  await ctx.answerCbQuery();
  await ctx.reply('Which country is your tailoring base in?');
};

export const handleTailorPublicNameInput = async (ctx) => {
  const result = validateTailorPublicName(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message, buildTailorPublicNameKeyboard());
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    publicName: result.value,
  };
  ctx.session.onboardingStep = 'tailor_country';

  await ctx.reply('Which country is your tailoring base in?');
  return true;
};

export const handleTailorCountryInput = async (ctx) => {
  const result = validateTailorCountry(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    country: result.value,
  };
  ctx.session.onboardingStep = 'tailor_city';

  await ctx.reply('Which city do you work from?');
  return true;
};

export const handleTailorCityInput = async (ctx) => {
  const result = validateTailorCity(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    city: result.value,
    area: result.value,
  };
  ctx.session.onboardingStep = 'tailor_work_address';

  await ctx.reply('What work address should we save for your tailoring base?');
  return true;
};

export const handleTailorWorkAddressInput = async (ctx) => {
  const result = validateTailorWorkAddress(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    workAddress: result.value,
    area: result.value,
  };
  ctx.session.onboardingStep = 'tailor_specialties';

  await ctx.reply('List your sewing categories or style specialties, separated by commas.');
  return true;
};

export const handleTailorSpecialtiesInput = async (ctx) => {
  const result = validateTailorSpecialties(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    specialties: result.value,
  };
  ctx.session.onboardingStep = 'tailor_budget_range';

  await ctx.reply('Enter your service range like 10000-50000, or send skip.');
  return true;
};

export const handleTailorBudgetRangeInput = async (ctx) => {
  const result = validateTailorBudgetRange(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    budgetRange: result.value,
  };

  logger.info(
    {
      event: 'tailor_budget_range_captured',
      updateType: ctx.updateType,
      hasBudgetRange: result.value.min !== null && result.value.max !== null,
    },
    'Captured tailor budget range input',
  );

  await finalizeTailorOnboarding(ctx);
  return true;
};

const finalizeTailorOnboarding = async (ctx) => {
  const draft = ctx.session.onboardingDraft ?? {};

  if (
    !draft.fullName ||
    !draft.businessName ||
    !draft.publicName ||
    !draft.country ||
    !draft.city ||
    !draft.workAddress ||
    !draft.specialties
  ) {
    await startTailorOnboarding(ctx);
    return;
  }

  let tailor;

  try {
    tailor = await completeTailorOnboarding({
      telegramUserId: String(ctx.from?.id ?? ''),
      telegramUsername: ctx.from?.username ?? '',
      fullName: draft.fullName,
      businessName: draft.businessName,
      publicName: draft.publicName,
      country: draft.country,
      city: draft.city,
      area: draft.area,
      workAddress: draft.workAddress,
      specialties: draft.specialties,
      budgetRange: draft.budgetRange ?? { min: null, max: null, currency: 'NGN' },
    });
  } catch (error) {
    logger.error(
      {
        event: 'tailor_onboarding_finalize_failed',
        error: serializeErrorForLog(error),
        updateType: ctx.updateType,
      },
      'Tailor onboarding finalization failed',
    );
    await ctx.reply('We could not save your tailor profile right now. Please try again in a moment.');
    return;
  }

  ctx.session.onboardingFlow = null;
  ctx.session.onboardingStep = null;
  ctx.session.onboardingDraft = null;
  ctx.session.pendingReferralCode = null;
  ctx.session.selectedRole = 'tailor';

  await ctx.reply(
    buildTailorSummary({ tailor }),
    buildTailorOnboardingControls(),
  );
};
