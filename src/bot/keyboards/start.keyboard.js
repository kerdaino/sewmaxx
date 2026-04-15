import { Markup } from 'telegraf';

export const buildStartRoleKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Client', 'start:role:client'),
      Markup.button.callback('Tailor', 'start:role:tailor'),
    ],
    [Markup.button.callback('Affiliate', 'start:role:affiliate')],
  ]);
