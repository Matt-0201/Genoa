require('dotenv').config();
const express = require("express");
const path = require('path');
const cors = require('cors');
const { connectDB } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Middlewares globaux
app.use(cors())
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Connexion BDD
const url = process.env.DB_URL; // Adresse de la bdd dans le .env

connectDB(url)

// Routes
app.use('/', authRoutes);

app.listen(3000, () => {
    console.log("Serveur démarré sur le port 3000");
})