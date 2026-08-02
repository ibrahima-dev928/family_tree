const express = require('express');
const eventsController = require('./events.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createEventSchema, updateEventSchema, rsvpSchema } = require('./events.schema');

const router = express.Router();

router.use(authMiddleware);

router.get('/', eventsController.list);
router.get('/:id', eventsController.getOne);
router.post('/', validate(createEventSchema), eventsController.create);
router.patch('/:id', validate(updateEventSchema), eventsController.update);
router.delete('/:id', eventsController.remove);
router.post('/:id/rsvp', validate(rsvpSchema), eventsController.rsvp);
router.get('/:id/rsvp', eventsController.getRsvps);

module.exports = router;