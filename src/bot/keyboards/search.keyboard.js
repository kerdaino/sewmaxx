import { Markup } from 'telegraf';

export const buildSearchControlsKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('Restart Search', 'search:restart')],
  ]);

export const buildSearchEmptyResultsKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('Try Another Search', 'search:restart')],
    [Markup.button.callback('Post a Request Now', 'search:next:requests')],
  ]);

export const buildSearchResultsKeyboard = ({ hasMore }) => {
  const rows = [];

  if (hasMore) {
    rows.push([Markup.button.callback('More Results', 'search:page:next')]);
  }

  rows.push([
    Markup.button.callback('Post a Request Now', 'search:next:requests'),
    Markup.button.callback('Search Again', 'search:restart'),
  ]);

  return Markup.inlineKeyboard(rows);
};
