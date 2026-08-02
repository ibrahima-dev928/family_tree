const messagingService = require('./messaging.service');

async function listConversations(req, res, next) {
  try {
    const conversations = await messagingService.listConversations(req.user.id);
    res.status(200).json(conversations);
  } catch (err) {
    next(err);
  }
}

async function createConversation(req, res, next) {
  try {
    const conversation = await messagingService.createConversation(req.body, req.user.id);
    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const { cursor, limit } = req.query;
    const messages = await messagingService.getMessages(req.params.id, req.user.id, { cursor, limit });
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await messagingService.createMessage(req.params.id, req.user.id, req.body);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const result = await messagingService.markAsRead(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listConversations, createConversation, getMessages, sendMessage, markAsRead };