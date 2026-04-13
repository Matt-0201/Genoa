const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route GET pour l'accueil
router.get('/', authController.getHome);

// Route POST pour le login
router.post('/login', authController.login);

router.get('/genoa', authController.getUsers);

module.exports = router;