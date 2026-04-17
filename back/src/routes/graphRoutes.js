const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');

// GET to get the tree
router.get('/graph', graphController.getGraph);

// Routes to modify members
router.post('/members', graphController.addMember);
router.put('/members/:id', graphController.updateMember);
router.delete('/members/:id', graphController.deleteMember);

// Routes to modify relations
router.post('/relationships', graphController.addRelationship);
router.delete('/relationships/:id', graphController.deleteRelationship);

module.exports = router;