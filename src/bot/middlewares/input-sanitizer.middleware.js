import { sanitizeBotInput } from '../utils/sanitize-bot-input.js';

export const botInputSanitizerMiddleware = async (ctx, next) => {
  if (typeof ctx.message?.text === 'string') {
    ctx.state.sanitizedText = sanitizeBotInput(ctx.message.text, 240);
  }

  if (typeof ctx.startPayload === 'string') {
    ctx.state.startPayload = sanitizeBotInput(ctx.startPayload, 40);
  }

  await next();
};
