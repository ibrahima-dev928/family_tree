const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('./error.middleware');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentification requise', 401));
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = payload;
    next();
  } catch (err) {
    next(new AppError('Token invalide ou expiré', 401));
  }
}

module.exports = authMiddleware;