const { z } = require('zod');

const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1, 'Au moins un participant requis'),
  isGroup: z.boolean().optional(),
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Le message ne peut pas être vide').max(5000),
  attachmentUrl: z.string().url().optional(),
});

module.exports = { createConversationSchema, sendMessageSchema };