const { z } = require('zod');

const createEventSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  eventType: z.enum(['bapteme', 'mariage', 'reunion', 'anniversaire', 'deces', 'autre']),
  description: z.string().max(3000).optional(),
  coverImageUrl: z.string().url('URL de couverture invalide').optional(),
  eventDate: z.string({ required_error: "La date de l'événement est requise" }),
  endDate: z.string().optional(),
  location: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

const rsvpSchema = z.object({
  response: z.enum(['yes', 'no', 'maybe']),
  guestsCount: z.number().int().min(0).optional(),
});

module.exports = { createEventSchema, updateEventSchema, rsvpSchema };