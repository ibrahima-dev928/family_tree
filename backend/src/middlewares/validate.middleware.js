const { AppError } = require('./error.middleware');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(' | ');
      return next(new AppError(`Données invalides — ${messages}`, 422));
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;