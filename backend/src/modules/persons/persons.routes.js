const express = require('express');
const personsController = require('./persons.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const upload = require('../../config/upload');
const { createPersonSchema, updatePersonSchema } = require('./persons.schema');

const router = express.Router();

router.use(authMiddleware);

// ROUTE POUR LES RELATIONS (AJOUTÉE ICI, AVANT /:id)
router.get('/relations', personsController.getRelations);

router.get('/', personsController.list);
router.get('/:id', personsController.getOne);
router.post('/', validate(createPersonSchema), personsController.create);
router.patch('/:id', validate(updatePersonSchema), personsController.update);
router.delete('/:id', personsController.remove);
router.post('/:id/photo', upload.single('photo'), personsController.uploadPhoto);

module.exports = router;