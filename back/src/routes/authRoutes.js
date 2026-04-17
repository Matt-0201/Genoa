const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddlewares = require('../middlewares/authMiddlewares');

// Route GET pour l'accueil
router.get('/', authMiddlewares, authController.getHome); 

// Route POST pour le login
router.post('/login', authController.login);

router.get('/genoa',authMiddlewares, authController.getUsers);

router.put('/admin/users/:id',authMiddlewares, authController.updateUserRole); //nouvelle route pour l'admin

router.get('/me', authMiddlewares, authController.getMe); //route pour connaitre son role

module.exports = router;


