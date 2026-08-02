const { z } = require('zod');

const parentChildSchema = z.object({
  parentId: z.string().uuid('parentId doit être un UUID valide'),
  childId: z.string().uuid('childId doit être un UUID valide'),
  relationType: z.enum(['biological', 'adoptive', 'step']).optional(),
});

const partnershipSchema = z.object({
  person1Id: z.string().uuid('person1Id doit être un UUID valide'),
  person2Id: z.string().uuid('person2Id doit être un UUID valide'),
  status: z.enum(['married', 'divorced', 'widowed', 'partner', 'separated']).optional(),
  unionDate: z.string().optional(),
  unionPlace: z.string().optional(),
});

const updatePartnershipSchema = z.object({
  status: z.enum(['married', 'divorced', 'widowed', 'partner', 'separated']),
  endDate: z.string().optional(),
});

module.exports = { parentChildSchema, partnershipSchema, updatePartnershipSchema };