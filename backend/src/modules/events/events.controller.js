const eventsService = require('./events.service');

async function list(req, res, next) {
  try {
    const { eventType, upcoming } = req.query;
    const events = await eventsService.list({ eventType, upcoming });
    res.status(200).json(events);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const event = await eventsService.getById(req.params.id);
    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const event = await eventsService.create(req.body, req.user.id);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const event = await eventsService.update(req.params.id, req.body, req.user);
    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await eventsService.remove(req.params.id, req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function rsvp(req, res, next) {
  try {
    const result = await eventsService.rsvp(req.params.id, req.user.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getRsvps(req, res, next) {
  try {
    const rsvps = await eventsService.getRsvps(req.params.id);
    res.status(200).json(rsvps);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, rsvp, getRsvps };