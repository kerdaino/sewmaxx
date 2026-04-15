import { Markup } from 'telegraf';

export const buildTailorOnboardingControls = () =>
  Markup.inlineKeyboard([[Markup.button.callback('Restart Tailor Setup', 'tailor:onboarding:restart')]]);

export const buildTailorPublicNameKeyboard = () =>
  Markup.inlineKeyboard([[Markup.button.callback('Use Business Name', 'tailor:onboarding:public-name:use-business-name')]]);
