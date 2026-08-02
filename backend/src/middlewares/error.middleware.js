class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Erreur interne du serveur';

  if (!err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && !err.isOperational
        ? { stack: err.stack }
        : {}),
    },
  });
}

function notFoundMiddleware(req, res) {
  res.status(404).json({ error: { message: 'Route introuvable' } });
}

module.exports = { AppError, errorMiddleware, notFoundMiddleware };