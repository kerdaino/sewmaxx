import { Composer } from 'telegraf';
import {
  handleAffiliateDisplayNameInput,
  handleAffiliateFullNameInput,
  handleAffiliateUseFullName,
  restartAffiliateOnboarding,
  startAffiliateOnboarding,
} from '../handlers/affiliate-onboarding.handler.js';
import {
  handleClientAreaInput,
  handleClientCityInput,
  handleClientCountryInput,
  handleClientFullNameInput,
  handleClientPhoneNumberInput,
  restartClientOnboarding,
  startClientOnboarding,
} from '../handlers/client-onboarding.handler.js';
import {
  handleTailorBudgetRangeInput,
  handleTailorBusinessNameInput,
  handleTailorCityInput,
  handleTailorCountryInput,
  handleTailorFullNameInput,
  handleTailorPhoneNumberInput,
  handleTailorPublicNameInput,
  handleTailorSpecialtiesInput,
  handleTailorUseBusinessName,
  handleTailorWorkAddressInput,
  restartTailorOnboarding,
  startTailorOnboarding,
} from '../handlers/tailor-onboarding.handler.js';

const onboardingRouter = new Composer();

onboardingRouter.command('onboarding', async (ctx) => {
  ctx.session.activeDomain = 'onboarding';
  ctx.session.lastCommand = '/onboarding';

  // Keep onboarding responses small and generic until full conversational flows are added.
  await ctx.reply(
    'Onboarding options are ready for affiliate, client, and tailor setup through the backend APIs.',
  );
});

onboardingRouter.action('affiliate:onboarding:display-name:use-full-name', handleAffiliateUseFullName);
onboardingRouter.action('affiliate:onboarding:restart', restartAffiliateOnboarding);
onboardingRouter.action('client:onboarding:restart', restartClientOnboarding);
onboardingRouter.action('tailor:onboarding:public-name:use-business-name', handleTailorUseBusinessName);
onboardingRouter.action('tailor:onboarding:restart', restartTailorOnboarding);

onboardingRouter.command('affiliate', async (ctx) => {
  ctx.session.lastCommand = '/affiliate';
  await startAffiliateOnboarding(ctx);
});

onboardingRouter.command('client', async (ctx) => {
  ctx.session.lastCommand = '/client';
  await startClientOnboarding(ctx);
});

onboardingRouter.command('tailor', async (ctx) => {
  ctx.session.lastCommand = '/tailor';
  await startTailorOnboarding(ctx);
});

onboardingRouter.on('text', async (ctx, next) => {
  if (ctx.session.onboardingFlow === 'affiliate') {
    if (ctx.session.onboardingStep === 'affiliate_full_name') {
      await handleAffiliateFullNameInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'affiliate_display_name') {
      await handleAffiliateDisplayNameInput(ctx);
      return;
    }
  }

  if (ctx.session.onboardingFlow === 'client') {
    if (ctx.session.onboardingStep === 'client_full_name') {
      await handleClientFullNameInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'client_phone_number') {
      await handleClientPhoneNumberInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'client_country') {
      await handleClientCountryInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'client_city') {
      await handleClientCityInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'client_area') {
      await handleClientAreaInput(ctx);
      return;
    }
  }

  if (ctx.session.onboardingFlow === 'tailor') {
    if (ctx.session.onboardingStep === 'tailor_full_name') {
      await handleTailorFullNameInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'tailor_phone_number') {
      await handleTailorPhoneNumberInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'tailor_business_name') {
      await handleTailorBusinessNameInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'tailor_public_name') {
      await handleTailorPublicNameInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'tailor_country') {
      await handleTailorCountryInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'tailor_city') {
      await handleTailorCityInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'tailor_work_address') {
      await handleTailorWorkAddressInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'tailor_specialties') {
      await handleTailorSpecialtiesInput(ctx);
      return;
    }

    if (ctx.session.onboardingStep === 'tailor_budget_range') {
      await handleTailorBudgetRangeInput(ctx);
      return;
    }
  }

  await next();
});

export default onboardingRouter;
