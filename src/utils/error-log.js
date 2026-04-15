export const serializeErrorForLog = (error) => ({
  name: error?.name,
  message: error?.message,
  code: error?.code,
  statusCode: error?.statusCode,
  ...(process.env.NODE_ENV === 'development' ? { stack: error?.stack } : {}),
});
