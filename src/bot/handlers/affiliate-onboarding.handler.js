import {
  buildAffiliateDisplayNameKeyboard,
  buildAffiliateKycKeyboard,
  buildAffiliateSummaryKeyboard,
} from '../keyboards/affiliate-onboarding.keyboard.js';
import {
  buildAffiliateSummary,
  completeAffiliateOnboarding,
  getExistingAffiliateProfile,
} from '../services/affiliate-onboarding.service.js';
import {
  validateAffiliateCity,
  validateAffiliateCountry,
  validateAffiliateDisplayName,
  validateAffiliateFullName,
  validateAffiliatePhoneNumber,
} from '../validators/affiliate-onboarding.validator.js';
import { buildNextStepsMessage } from '../services/role-guidance.service.js';
import { buildTelegramReferralLink } from '../utils/build-telegram-referral-link.js';

const resetAffiliateDraft = (ctx) => {
  ctx.session.onboardingFlow = 'affiliate';
  ctx.session.activeDomain = 'onboarding';
  ctx.session.selectedRole = 'affiliate';
  ctx.session.onboardingDraft = {};
};

const promptAffiliateFullName = async (ctx, prefix = 'Let’s set up your affiliate profile.') => {
  await ctx.reply(`${prefix}\n\nWhat is your full name?\nExample: Adaeze Okeke`);
};

const extractAffiliateAssetFromMessage = (ctx) => {
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

  await promptAffiliateFullName(ctx);
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
    'What display name or brand name should people see?\nExample: Ada Style Connect\nYou can also use your full name.',
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

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    displayName: fullName,
  };
  ctx.session.onboardingStep = 'affiliate_phone_number';

  await ctx.answerCbQuery();
  await ctx.reply(
    'What phone number should we save for affiliate KYC?\nExample: +234 801 234 5678',
    buildAffiliateKycKeyboard(),
  );
};

export const handleAffiliateDisplayNameInput = async (ctx) => {
  const result = validateAffiliateDisplayName(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message, buildAffiliateDisplayNameKeyboard());
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    displayName: result.value,
  };
  ctx.session.onboardingStep = 'affiliate_phone_number';

  await ctx.reply(
    'What phone number should we save for affiliate KYC?\nExample: +234 801 234 5678',
    buildAffiliateKycKeyboard(),
  );
  return true;
};

export const handleAffiliatePhoneNumberInput = async (ctx) => {
  const result = validateAffiliatePhoneNumber(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message, buildAffiliateKycKeyboard());
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    phoneNumber: result.value,
  };
  ctx.session.onboardingStep = 'affiliate_country';

  await ctx.reply('Which country should we save for affiliate KYC?\nExample: Nigeria');
  return true;
};

export const handleAffiliateCountryInput = async (ctx) => {
  const result = validateAffiliateCountry(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message, buildAffiliateKycKeyboard());
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    country: result.value,
  };
  ctx.session.onboardingStep = 'affiliate_city';

  await ctx.reply('Which city should we save for affiliate KYC?\nExample: Lagos');
  return true;
};

export const handleAffiliateCityInput = async (ctx) => {
  const result = validateAffiliateCity(ctx.state.sanitizedText ?? '');

  if (!result.isValid) {
    await ctx.reply(result.message, buildAffiliateKycKeyboard());
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    city: result.value,
  };
  ctx.session.onboardingStep = 'affiliate_id_upload';

  await ctx.reply(
    'Upload your affiliate ID as a photo or image document.\nExample: national ID card, voter card, driver’s license, or international passport image.',
    buildAffiliateKycKeyboard(),
  );
  return true;
};

export const handleAffiliateIdUpload = async (ctx) => {
  const asset = extractAffiliateAssetFromMessage(ctx);

  if (!asset) {
    await ctx.reply('Please send your affiliate ID as a photo or image document.', buildAffiliateKycKeyboard());
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    kycDetails: {
      ...(ctx.session.onboardingDraft?.kycDetails ?? {}),
      idDocument: asset,
    },
  };
  ctx.session.onboardingStep = 'affiliate_selfie_with_id_upload';

  await ctx.reply(
    'ID saved.\n\nNow upload a selfie while holding the same ID as a clear photo or image document.',
    buildAffiliateKycKeyboard(),
  );
  return true;
};

export const handleAffiliateSelfieWithIdUpload = async (ctx) => {
  const asset = extractAffiliateAssetFromMessage(ctx);

  if (!asset) {
    await ctx.reply(
      'Please send a selfie while holding the same uploaded ID as a clear photo or image document.',
      buildAffiliateKycKeyboard(),
    );
    return true;
  }

  ctx.session.onboardingDraft = {
    ...(ctx.session.onboardingDraft ?? {}),
    kycDetails: {
      ...(ctx.session.onboardingDraft?.kycDetails ?? {}),
      selfieWithId: asset,
    },
  };

  await finalizeAffiliateOnboarding(ctx);
  return true;
};

export const restartAffiliateOnboarding = async (ctx) => {
  resetAffiliateDraft(ctx);
  ctx.session.onboardingStep = 'affiliate_full_name';
  ctx.session.pendingReferralCode = null;

  if (ctx.answerCbQuery) {
    await ctx.answerCbQuery('Affiliate onboarding restarted');
  }

  await promptAffiliateFullName(ctx, 'Affiliate onboarding restarted.');
};

const finalizeAffiliateOnboarding = async (ctx) => {
  const { city, country, displayName, fullName, kycDetails, phoneNumber } = ctx.session.onboardingDraft ?? {};

  if (
    !fullName ||
    !displayName ||
    !phoneNumber ||
    !country ||
    !city ||
    !kycDetails?.idDocument?.telegramFileId ||
    !kycDetails?.selfieWithId?.telegramFileId
  ) {
    await startAffiliateOnboarding(ctx);
    return;
  }

  const result = await completeAffiliateOnboarding({
    telegramUserId: String(ctx.from?.id ?? ''),
    telegramUsername: ctx.from?.username ?? '',
    fullName,
    displayName,
    phoneNumber,
    country,
    city,
    kycDetails,
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
  await ctx.reply(buildNextStepsMessage('affiliate'));
};
