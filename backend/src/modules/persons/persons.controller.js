const personsService = require('./persons.service');

async function getOne(req, res, next) {
  try {
    const person = await personsService.getById(req.params.id);
    res.status(200).json(person);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { search } = req.query;
    const persons = await personsService.list({ search });
    res.status(200).json(persons);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const result = await personsService.createPerson(req.body, req.user);
    // 201 si créé directement (admin), 202 "Accepted" si mis en attente (membre)
    const status = result.pendingRequest ? 202 : 201;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await personsService.updatePerson(req.params.id, req.body, req.user);
    const status = result.pendingRequest ? 202 : 200;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await personsService.deletePerson(req.params.id, req.user);
    const status = result.pendingRequest ? 202 : 200;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
}

async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'Aucun fichier reçu' } });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    const person = await personsService.updatePhoto(req.params.id, photoUrl);
    res.status(200).json(person);
  } catch (err) {
    next(err);
  }
}

module.exports = { getOne, list, create, update, remove, uploadPhoto };