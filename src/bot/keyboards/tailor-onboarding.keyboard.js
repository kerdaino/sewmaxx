import { Markup } from 'telegraf';

export const buildTailorOnboardingControls = () =>
  Markup.inlineKeyboard([[Markup.button.callback('Restart Tailor Setup', 'tailor:onboarding:restart')]]);

export const buildTailorPublicNameKeyboard = () =>
  Markup.inlineKeyboard([[Markup.button.callback('Use Business Name', 'tailor:onboarding:public-name:use-business-name')]]);

export const buildTailorEntryKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('Accept', 'tailor:onboarding:entry:accept')],
    [Markup.button.callback('Cancel', 'tailor:onboarding:entry:cancel')],
  ]);

export const buildTailorTermsKeyboard = (termsPdfUrl) => {
  const buttons = [];

  if (termsPdfUrl) {
    buttons.push([Markup.button.url('View Terms', termsPdfUrl)]);
  }

  buttons.push([Markup.button.callback('Continue After Viewing', 'tailor:onboarding:terms:reviewed')]);
  buttons.push([Markup.button.callback('Cancel', 'tailor:onboarding:entry:cancel')]);

  return Markup.inlineKeyboard(buttons);
};

export const buildTailorAgreementKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('I Agree', 'tailor:onboarding:agreement:accept')],
    [Markup.button.callback('Cancel', 'tailor:onboarding:entry:cancel')],
  ]);
