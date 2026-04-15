import { Markup } from 'telegraf';

export const buildClientOnboardingControls = () =>
  Markup.inlineKeyboard([[Markup.button.callback('Restart Client Setup', 'client:onboarding:restart')]]);
