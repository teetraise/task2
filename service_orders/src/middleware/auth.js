exports.extractUser = (req, res, next) => {
  if (req.headers['x-user-id']) {
    req.user = {
      id: req.headers['x-user-id'],
      role: req.headers['x-user-role'] || 'client'
    };
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User information required'
      }
    });
  }

  next();
};
