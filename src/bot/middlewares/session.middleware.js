import { enforceSessionStoreLimit, getBotSession, pruneExpiredSessions } from '../utils/session-store.js';

export const botSessionMiddleware = async (ctx, next) => {
  const sessionKey = String(ctx.from?.id ?? ctx.chat?.id ?? 'anonymous');
  pruneExpiredSessions();
  enforceSessionStoreLimit();
  ctx.session = getBotSession(sessionKey);
  ctx.session.lastSeenAt = new Date().toISOString();
  await next();
};
