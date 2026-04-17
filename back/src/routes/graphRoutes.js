const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');
const authMiddlewares = require('../middlewares/authMiddlewares');

// GET to get the tree
router.get('/graph', graphController.getGraph);

// Routes to modify members
router.post('/members',authMiddlewares, graphController.addMember);
router.put('/members/:id',authMiddlewares, graphController.updateMember);
router.delete('/members/:id',authMiddlewares, graphController.deleteMember);

// Routes to modify relations
router.post('/relationships',authMiddlewares, graphController.addRelationship);
router.put('/relationships/:id', authMiddlewares, graphController.updateRelationship);
router.delete('/relationships/:id',authMiddlewares, graphController.deleteRelationship);

module.exports = router;