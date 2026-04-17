export const serializeErrorForLog = (error) => ({
  name: error?.name,
  message: error?.message,
  code: error?.code,
  codeName: error?.codeName,
  type: error?.type,
  errno: error?.errno,
  syscall: error?.syscall,
  statusCode: error?.statusCode,
  ...(process.env.NODE_ENV === 'development' ? { stack: error?.stack } : {}),
});

export const getMongoErrorLogContext = (error) => {
  const code = error?.code;
  const codeName = error?.codeName;

  if (code === 18 || code === 8000 || codeName === 'AuthenticationFailed') {
    return {
      failureType: 'mongodb_auth',
      hint: 'Check MongoDB username, password, auth source, and cluster access rules.',
    };
  }

  if (
    ['MongoNetworkError', 'MongooseServerSelectionError', 'MongoServerSelectionError'].includes(
      error?.name,
    ) ||
    ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error?.code)
  ) {
    return {
      failureType: 'mongodb_connectivity',
      hint: 'Check network access, DNS resolution, MongoDB URI host, and cluster availability.',
    };
  }

  return {
    failureType: 'mongodb_unknown',
    hint: 'Check MongoDB configuration, credentials, and server health.',
  };
};

export const getStartupErrorLogContext = (error, stage = 'startup') => {
  if (error?.code === 'ENV_VALIDATION_ERROR') {
    return {
      stage,
      failureType: 'configuration',
      hint: 'Review required environment variables and startup configuration values.',
    };
  }

  if (stage === 'database') {
    return {
      stage,
      ...getMongoErrorLogContext(error),
    };
  }

  if (stage === 'bot') {
    return {
      stage,
      failureType: 'telegram_bot',
      hint: 'Check Telegram bot credentials, webhook settings, and Telegram API reachability.',
    };
  }

  if (stage === 'server_listen') {
    return {
      stage,
      failureType: 'http_server',
      hint: 'Check that the configured port is available and the process can bind to it.',
    };
  }

  return {
    stage,
    failureType: 'startup_unknown',
    hint: 'Check application configuration and dependency availability before retrying startup.',
  };
};
