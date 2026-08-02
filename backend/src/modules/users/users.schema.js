const { z } = require('zod');

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  photoUrl: z.string().url('URL de photo invalide').optional(),
  bio: z.string().max(2000, 'La biographie est trop longue').optional(),
  occupation: z.string().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'moderator', 'member'], {
    errorMap: () => ({ message: "Le rôle doit être 'admin', 'moderator' ou 'member'" }),
  }),
});

const updateEmailSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  currentPassword: z.string().min(1, 'Mot de passe requis pour confirmer'),
});

module.exports = { updateProfileSchema, updateRoleSchema, updateEmailSchema };