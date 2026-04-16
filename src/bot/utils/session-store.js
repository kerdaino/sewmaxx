import { env } from '../../config/env.js';
import { securityConfig } from '../../config/security.js';
import { BOT_SESSION_DEFAULTS } from '../constants.js';

const sessionStore = new Map();

const getExpiryTime = () => Date.now() + env.BOT_SESSION_TTL_SECONDS * 1000;

const cloneDefaults = () => ({
  ...BOT_SESSION_DEFAULTS,
  expiresAt: getExpiryTime(),
});

export const getBotSession = (sessionKey) => {
  const existing = sessionStore.get(sessionKey);

  if (!existing || existing.expiresAt <= Date.now()) {
    const nextSession = cloneDefaults();
    sessionStore.set(sessionKey, nextSession);
    return nextSession;
  }

  existing.expiresAt = getExpiryTime();
  return existing;
};

export const pruneExpiredSessions = () => {
  for (const [key, value] of sessionStore.entries()) {
    if (value.expiresAt <= Date.now()) {
      sessionStore.delete(key);
    }
  }
};

export const enforceSessionStoreLimit = () => {
  pruneExpiredSessions();

  while (sessionStore.size >= securityConfig.botSession.maxSessions) {
    const oldestSessionKey = sessionStore.keys().next().value;

    if (!oldestSessionKey) {
      break;
    }

    sessionStore.delete(oldestSessionKey);
  }
};
