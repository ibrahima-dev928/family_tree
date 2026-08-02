const express = require('express');
const treeController = require('./tree.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', treeController.getFullTree);
router.get('/:personId/subtree', treeController.getSubtree);

module.exports = router;