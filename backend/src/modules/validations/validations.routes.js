const express = require('express');
const validationsController = require('./validations.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { reviewSchema } = require('./validations.schema');

const router = express.Router();

// Tout le module est réservé aux admins et modérateurs
router.use(authMiddleware, roleMiddleware(['admin', 'moderator']));

router.get('/pending', validationsController.listPending);
router.post('/:id/approve', validate(reviewSchema), validationsController.approve);
router.post('/:id/reject', validate(reviewSchema), validationsController.reject);

module.exports = router;