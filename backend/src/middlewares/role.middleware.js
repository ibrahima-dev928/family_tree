const { AppError } = require('./error.middleware');

function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentification requise', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Accès refusé : permissions insuffisantes', 403));
    }
    next();
  };
}

module.exports = roleMiddleware;