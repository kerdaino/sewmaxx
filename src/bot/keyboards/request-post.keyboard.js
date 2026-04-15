import { Markup } from 'telegraf';

export const buildRequestOutfitTypeKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Agbada', 'request:outfit:agbada'),
      Markup.button.callback('Dress', 'request:outfit:dress'),
    ],
    [
      Markup.button.callback('Senator', 'request:outfit:senator'),
      Markup.button.callback('Wedding', 'request:outfit:wedding'),
    ],
    [
      Markup.button.callback('Uniform', 'request:outfit:uniform'),
      Markup.button.callback('Other', 'request:outfit:other'),
    ],
  ]);

export const buildRequestSummaryKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Edit Outfit', 'request:edit:outfit'),
      Markup.button.callback('Edit Budget', 'request:edit:budget'),
    ],
    [
      Markup.button.callback('Edit Location', 'request:edit:location'),
      Markup.button.callback('Edit Due Date', 'request:edit:due_date'),
    ],
    [
      Markup.button.callback('Publish Request', 'request:publish'),
      Markup.button.callback('Restart', 'request:restart'),
    ],
  ]);

export const buildRequestRestartKeyboard = () =>
  Markup.inlineKeyboard([[Markup.button.callback('Restart Request Flow', 'request:restart')]]);
