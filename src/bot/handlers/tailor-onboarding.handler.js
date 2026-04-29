import {
  buildTailorAgreementKeyboard,
  buildTailorEntryKeyboard,
  buildTailorOnboardingControls,
  buildTailorPublicNameKeyboard,
  buildTailorTermsKeyboard,
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
  validateTailorPhoneNumber,
  validateTailorPublicName,
  validateTailorSpecialties,
  validateTailorWorkAddress,
} from '../validators/tailor-onboarding.validator.js';
import { buildNextStepsMessage } from '../services/role-guidance.service.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { serializeErrorForLog } from '../../utils/error-log.js';

const resetTailorDraft = (ctx) => {
  ctx.session.onboardingFlow = 'tailor';
  ctx.session.activeDomain = 'onboarding';
  ctx.session.selectedRole = 'tailor';
  ctx.session.onboardingDraft = {};
};

const buildTailorRequirementsMessage = () =>
  [
    'Tailor onboarding requirements',
    '',
    'Please review the Sewmaxx tailor onboarding requirements carefully before you continue.',
    '',
    'To join Sewmaxx, you must:',
    '- Be at least 18 years old',
    '- Have proven experience in tailoring',
    '- Be capable of producing African wear, including Agbada, Kaftan, and related garments',
    '- Own or have access to sewing equipment',
    '- Be able to deliver consistent, professional results',
    '- Be ready to submit your price range, portfolio, ID, workplace image, and selfie while holding the same ID for admin review',
    '',
    'Select Accept to review the Terms & Conditions, or Cancel to stop here.',
  ].join('\n');

const buildTailorTermsMessage = () =>
  [
    'Tailor terms review',
    '',
    'Please review the official Terms & Conditions before continuing.',
    env.TAILOR_TERMS_PDF_URL
      ? 'Tap View Terms to open the tailor onboarding PDF, then tap Continue After Viewing when you are done.'
      : 'The tailor onboarding PDF is not configured yet. Review the terms with an admin, then continue.',
  ].join('\n');

const buildTailorAgreementMessage = () =>
  [
    'Tailor agreement confirmation',
    '',
    'By continuing, you confirm that you understand and accept Sewmaxx terms, pricing, and commission structure.',
    '',
    'You also confirm that you have reviewed the official terms and agree to Sewmaxx policies before onboarding continues.',
  ].join('\n');

const extractTelegramAssetFromMessage = (ctx) => {
  if (Array.isArray(ctx.message?.photo) && ctx.message.photo.length > 0) {
    const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];

    return {
      telegramFileId: largestPhoto.file_id,
      telegramFileUniqueId: largestPhoto.file_unique_id ?? '',
      telegramFileType: 'photo',
      mimeType: 'image/jpeg',
      fileName: '',
      submittedAt: new Date(),
    };
  }

  if (
    ctx.message?.document?.file_id &&
    typeof ctx.message.document.mime_type === 'string' &&
    ctx.message.document.mime_type.startsWith('image/')
  ) {
    return {
      telegramFileId: ctx.message.document.file_id,
      telegramFileUniqueId: ctx.message.document.file_unique_id ?? '',
      telegramFileType: 'document',
      mimeType: ctx.message.document.mime_type,
      fileName: ctx.message.document.file_name ?? '',
      submittedAt: new Date(),
    };
  }

  return null;
};

const promptTailorFullName = async (ctx, prefix = 'Let’s set up your tailor profile.') => {
  await ctx.reply(`${prefix}\n\nWhat is your full name?\nExample: Adaobi Okafor`);
};

const promptTailorCountry = async (ctx) => {
  await ctx.reply('Which country is your tailoring base in?\nExamples: Nigeria, Ghana, Kenya');
};

const cancelTailorOnboarding = async (ctx, callbackMessage = 'Tailor onboarding reset') => {
  resetTailorDraft(ctx);
  ctx.session.onboardingStep = 'tailor_requirements_gate';

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery(callbackMessage);
  }

  await ctx.reply(buildTailorRequirementsMessage(), buildTailorEntryKeyboard());
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
  ctx.session.onboardingStep = 'tailor_requirements_gate';

  await ctx.reply(buildTailorRequirementsMessage(), buildTailorEntryKeyboard());
};

export const restartTailorOnboarding = async (ctx) => {
  resetTailorDraft(ctx);
  ctx.session.onboardingStep = 'tailor_requirements_gate';

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Tailor onboarding restarted');
  }

  await ctx.reply(buildTailorRequirementsMessage(), buildTailorEntryKeyboard());
};

export const handleTailorEntryAccept = async (ctx) => {
  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    onboardingAgreement: {
      ...(ctx.session.onboardingDraft?.onboardingAgreement ?? {}),
      requirementsAcknowledgedAt: new Date().toISOString(),
      termsPdfUrl: env.TAILOR_TERMS_PDF_URL ?? '',
    },
  };
  ctx.session.onboardingStep = 'tailor_terms_review';

  await ctx.answerCbQuery();
  await ctx.reply(buildTailorTermsMessage(), buildTailorTermsKeyboard(env.TAILOR_TERMS_PDF_URL));
};

export const handleTailorTermsReviewed = async (ctx) => {
  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    onboardingAgreement: {
      ...(ctx.session.onboardingDraft?.onboardingAgreement ?? {}),
      termsReviewedAt: new Date().toISOString(),
      termsPdfUrl: env.TAILOR_TERMS_PDF_URL ?? '',
    },
  };
  ctx.session.onboardingStep = 'tailor_agreement_confirmation';

  await ctx.answerCbQuery();
  await ctx.reply(buildTailorAgreementMessage(), buildTailorAgreementKeyboard());
};

export const handleTailorAgreementAccept = async (ctx) => {
  const acceptedAt = new Date().toISOString();

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    onboardingAgreement: {
      ...(ctx.session.onboardingDraft?.onboardingAgreement ?? {}),
      policiesAcceptedAt: acceptedAt,
      pricingAcceptedAt: acceptedAt,
      termsPdfUrl: env.TAILOR_TERMS_PDF_URL ?? '',
    },
  };
  ctx.session.onboardingStep = 'tailor_full_name';

  await ctx.answerCbQuery();
  await promptTailorFullName(ctx);
};

export const handleTailorEntryCancel = async (ctx) => {
  await cancelTailorOnboarding(ctx);
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
  ctx.session.onboardingStep = 'tailor_phone_number';

  await ctx.reply(
    'What phone or WhatsApp contact should we save for Sewmaxx coordination?\nExample: +2348012345678 or wa.me/233205245619',
  );
  return true;
};

export const handleTailorPhoneNumberInput = async (ctx) => {
  const result = validateTailorPhoneNumber(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message);
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    phoneNumber: result.value,
  };
  ctx.session.onboardingStep = 'tailor_business_name';

  await ctx.reply('What is your business name?\nExample: Ada Stitches Atelier');
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
    'What public name should clients see?\nExample: Ada Bridal Studio\nYou can also tap Use Business Name if you want both to match.',
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
  await promptTailorCountry(ctx);
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

  await promptTailorCountry(ctx);
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

  await ctx.reply('Which city do you work from?\nExamples: Lagos, Accra, Nairobi');
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

  await ctx.reply(
    'What work address should we save for your tailoring base?\nExample: 12 High Street, city center',
  );
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

  await ctx.reply(
    'List your sewing specialties, separated by commas.\nExample: Bridal, Asoebi, Ready-to-wear',
  );
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

  await ctx.reply(
    'Enter your service price range in your local currency, e.g. 10000-50000.',
  );
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
  ctx.session.onboardingStep = 'tailor_portfolio_upload';

  await ctx.reply(
    'Upload one clear portfolio image from your previous work.\nExample: a finished bridal gown, senator wear, kaftan, or ready-to-wear piece.',
  );
  return true;
};

export const handleTailorPortfolioUpload = async (ctx) => {
  const asset = extractTelegramAssetFromMessage(ctx);

  if (!asset) {
    await ctx.reply('Please send your portfolio as a clear photo or image document.');
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    portfolio: [
      ...((Array.isArray(ctx.session.onboardingDraft?.portfolio) && ctx.session.onboardingDraft.portfolio) || []),
      {
        title: 'Portfolio Upload',
        assetKey: asset.telegramFileId,
        caption: '',
        ...asset,
      },
    ],
  };
  ctx.session.onboardingStep = 'tailor_id_upload';

  await ctx.reply(
    'Portfolio saved.\n\nNow upload your ID document as a clear photo or image document.\nExample: national ID, voter card, driver’s license, or passport image.',
  );
  return true;
};

export const handleTailorIdUpload = async (ctx) => {
  const asset = extractTelegramAssetFromMessage(ctx);

  if (!asset) {
    await ctx.reply('Please send your ID as a clear photo or image document.');
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    kyc: {
      ...(ctx.session.onboardingDraft?.kyc ?? {}),
      idDocument: asset,
    },
  };
  ctx.session.onboardingStep = 'tailor_selfie_with_id_upload';

  await ctx.reply(
    'ID saved.\n\nNow upload a selfie while holding the same ID.\nExample: a clear selfie showing your face and the same ID used above.',
  );
  return true;
};

export const handleTailorSelfieWithIdUpload = async (ctx) => {
  const asset = extractTelegramAssetFromMessage(ctx);

  if (!asset) {
    await ctx.reply(
      'Please send a clear selfie while holding the same ID you uploaded, as a photo or image document.',
    );
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    kyc: {
      ...(ctx.session.onboardingDraft?.kyc ?? {}),
      selfieWithId: asset,
    },
  };
  ctx.session.onboardingStep = 'tailor_workplace_image_upload';

  await ctx.reply(
    'Selfie saved.\n\nNow upload a clear workplace image for KYC.\nExample: your sewing space, tailoring shop front, or in-studio work area.',
  );
  return true;
};

export const handleTailorWorkplaceImageUpload = async (ctx) => {
  const asset = extractTelegramAssetFromMessage(ctx);

  if (!asset) {
    await ctx.reply('Please send your workplace image as a clear photo or image document.');
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    kyc: {
      ...(ctx.session.onboardingDraft?.kyc ?? {}),
      workplaceImage: asset,
    },
  };

  await finalizeTailorOnboarding(ctx);
  return true;
};

const finalizeTailorOnboarding = async (ctx) => {
  const draft = ctx.session.onboardingDraft ?? {};

  if (
    !draft.onboardingAgreement?.requirementsAcknowledgedAt ||
    !draft.onboardingAgreement?.termsReviewedAt ||
    !draft.onboardingAgreement?.policiesAcceptedAt ||
    !draft.onboardingAgreement?.pricingAcceptedAt ||
    !draft.fullName ||
    !draft.phoneNumber ||
    !draft.businessName ||
    !draft.publicName ||
    !draft.country ||
    !draft.city ||
    !draft.workAddress ||
    !draft.specialties ||
    !draft.budgetRange ||
    !Array.isArray(draft.portfolio) ||
    draft.portfolio.length === 0 ||
    !draft.kyc?.idDocument?.telegramFileId ||
    !draft.kyc?.selfieWithId?.telegramFileId ||
    !draft.kyc?.workplaceImage?.telegramFileId
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
      phoneNumber: draft.phoneNumber,
      businessName: draft.businessName,
      publicName: draft.publicName,
      country: draft.country,
      city: draft.city,
      area: draft.area,
      workAddress: draft.workAddress,
      specialties: draft.specialties,
      budgetRange: draft.budgetRange,
      portfolio: draft.portfolio,
      kyc: draft.kyc,
      onboardingAgreement: draft.onboardingAgreement,
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
  await ctx.reply(buildNextStepsMessage('tailor'));
};
