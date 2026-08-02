const express = require('express');
const relationsController = require('./relations.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  parentChildSchema,
  partnershipSchema,
  updatePartnershipSchema,
} = require('./relations.schema');

const router = express.Router();

router.use(authMiddleware);

router.post('/parent-child', validate(parentChildSchema), relationsController.createParentChild);
router.post('/partnerships', validate(partnershipSchema), relationsController.createPartnership);
router.patch('/partnerships/:id', validate(updatePartnershipSchema), relationsController.updatePartnership);
router.delete('/parent-child/:id', relationsController.deleteParentChild);
router.delete('/partnerships/:id', relationsController.deletePartnership);

module.exports = router;