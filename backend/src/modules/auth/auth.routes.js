const express = require('express');
const authController = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const { registerSchema, loginSchema, changePasswordSchema } = require('./auth.schema');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);

module.exports = router;