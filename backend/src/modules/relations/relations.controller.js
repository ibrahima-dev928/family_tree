const relationsService = require('./relations.service');

async function createParentChild(req, res, next) {
  try {
    const result = await relationsService.createParentChild(req.body, req.user);
    const status = result.status === 'pending' ? 202 : 201;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
}

async function createPartnership(req, res, next) {
  try {
    const result = await relationsService.createPartnership(req.body, req.user);
    const status = result.status === 'pending' ? 202 : 201;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
}

async function updatePartnership(req, res, next) {
  try {
    const result = await relationsService.updatePartnership(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteParentChild(req, res, next) {
  try {
    const result = await relationsService.deleteParentChild(req.params.id, req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function deletePartnership(req, res, next) {
  try {
    const result = await relationsService.deletePartnership(req.params.id, req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createParentChild, createPartnership, updatePartnership, deleteParentChild, deletePartnership,
};