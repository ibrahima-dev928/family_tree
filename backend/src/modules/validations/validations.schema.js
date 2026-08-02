const { z } = require('zod');

const reviewSchema = z.object({
  reviewNote: z.string().max(1000).optional(),
});

module.exports = { reviewSchema };