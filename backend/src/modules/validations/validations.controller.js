const validationsService = require('./validations.service');

async function listPending(req, res, next) {
  try {
    const requests = await validationsService.listPending();
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const result = await validationsService.approve(
      req.params.id,
      req.user.id,
      req.body.reviewNote
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const result = await validationsService.reject(
      req.params.id,
      req.user.id,
      req.body.reviewNote
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listPending, approve, reject };