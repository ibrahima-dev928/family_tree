const treeService = require('./tree.service');

async function getFullTree(req, res, next) {
  try {
    const tree = await treeService.getFullTree();
    res.status(200).json(tree);
  } catch (err) {
    next(err);
  }
}

async function getSubtree(req, res, next) {
  try {
    const subtree = await treeService.getSubtree(req.params.personId);
    res.status(200).json(subtree);
  } catch (err) {
    next(err);
  }
}

module.exports = { getFullTree, getSubtree };