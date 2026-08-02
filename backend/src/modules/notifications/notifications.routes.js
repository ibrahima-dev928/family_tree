const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const notificationsService = require('./notifications.service');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await notificationsService.list(req.user.id);
    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await notificationsService.markAsRead(req.params.id, req.user.id);
    res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    const result = await notificationsService.markAllAsRead(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;