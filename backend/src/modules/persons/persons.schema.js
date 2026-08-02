const { z } = require('zod');

const personDataSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  maidenName: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: z.string().optional(),   // format ISO "1991-03-12"
  birthPlace: z.string().optional(),
  deathDate: z.string().optional(),
  deathPlace: z.string().optional(),
  bio: z.string().max(3000).optional(),
  occupation: z.string().optional(),
});

// Pour une création : tous les champs obligatoires ci-dessus sont requis
const createPersonSchema = personDataSchema;

// Pour une modification : tous les champs deviennent optionnels (mise à jour partielle)
const updatePersonSchema = personDataSchema.partial();

module.exports = { createPersonSchema, updatePersonSchema };