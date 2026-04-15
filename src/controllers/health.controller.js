export const getHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
    data: {
      uptime: process.uptime(),
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  });
};
