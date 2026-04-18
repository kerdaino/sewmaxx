import { Markup } from 'telegraf';

export const buildAffiliateDisplayNameKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('Use Full Name', 'affiliate:onboarding:display-name:use-full-name')],
    [Markup.button.callback('Restart', 'affiliate:onboarding:restart')],
  ]);

export const buildAffiliateKycKeyboard = () =>
  Markup.inlineKeyboard([[Markup.button.callback('Restart', 'affiliate:onboarding:restart')]]);

export const buildAffiliateSummaryKeyboard = (referralLink) => {
  const buttons = [[Markup.button.callback('Restart Affiliate Setup', 'affiliate:onboarding:restart')]];

  if (referralLink) {
    buttons.unshift([Markup.button.url('Open Referral Link', referralLink)]);
  }

  return Markup.inlineKeyboard(buttons);
};
