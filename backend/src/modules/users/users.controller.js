const usersService = require('./users.service');

async function getMe(req, res, next) {
  try {
    const user = await usersService.getById(req.user.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await usersService.updateProfile(req.user.id, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const { q } = req.query;
    const users = await usersService.search(q);
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await usersService.updateRole(id, role);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    const { id } = req.params;
    const user = await usersService.deactivate(id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function updateEmail(req, res, next) {
  try {
    const user = await usersService.updateEmail(req.user.id, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, search, updateRole, deactivate, updateEmail };