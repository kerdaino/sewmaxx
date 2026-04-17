import { Markup } from 'telegraf';

export const buildTailorRequestControlsKeyboard = ({ hasMore }) => {
  const rows = [];

  if (hasMore) {
    rows.push([Markup.button.callback('More Requests', 'tailor:requests:page:next')]);
  }

  rows.push([Markup.button.callback('Refresh Requests', 'tailor:requests:restart')]);

  return Markup.inlineKeyboard(rows);
};

export const buildTailorRequestEmptyKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('Refresh Requests', 'tailor:requests:restart')],
  ]);
