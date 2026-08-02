const express = require('express');
const messagingController = require('./messaging.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createConversationSchema, sendMessageSchema } = require('./messaging.schema');

const router = express.Router();

router.use(authMiddleware);

router.get('/', messagingController.listConversations);
router.post('/', validate(createConversationSchema), messagingController.createConversation);
router.get('/:id/messages', messagingController.getMessages);
router.post('/:id/messages', validate(sendMessageSchema), messagingController.sendMessage);
router.patch('/:id/read', messagingController.markAsRead);

module.exports = router;