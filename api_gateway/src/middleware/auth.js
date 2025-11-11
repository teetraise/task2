const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const publicRoutes = [
  '/v1/auth/register',
  '/v1/auth/login',
  '/health',
  '/status'
];

const isPublicRoute = (path) => {
  return publicRoutes.some(route => path.startsWith(route));
};

exports.authenticate = (req, res, next) => {
  if (isPublicRoute(req.path)) {
    return next();
  }

  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to access this route'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role || 'client'
    };

    next();
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Authentication error');

    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }
};
