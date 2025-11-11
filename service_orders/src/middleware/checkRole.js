exports.canAccessOrder = (order, userId, userRole) => {
  return (
    order.userId === userId ||
    userRole === 'admin' ||
    userRole === 'manager'
  );
};

exports.isManagerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Access denied. Manager or Admin role required.'
    }
  });
};
