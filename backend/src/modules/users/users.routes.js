const express = require('express');
const usersController = require('./users.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { updateProfileSchema, updateRoleSchema, updateEmailSchema } = require('./users.schema');

const router = express.Router();

// Toutes les routes de ce module nécessitent d'être connecté
router.use(authMiddleware);

router.get('/me', usersController.getMe);
router.patch('/me', validate(updateProfileSchema), usersController.updateMe);
router.patch('/me/email', validate(updateEmailSchema), usersController.updateEmail);
router.get('/search', usersController.search);

// Routes réservées aux admins
router.patch('/:id/role', roleMiddleware(['admin']), validate(updateRoleSchema), usersController.updateRole);
router.patch('/:id/deactivate', roleMiddleware(['admin']), usersController.deactivate);

module.exports = router;