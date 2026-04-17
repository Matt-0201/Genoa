require('dotenv').config();
const express = require("express");
const path = require('path');
const cors = require('cors');
const { connectDB } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const graphRoutes = require('./src/routes/graphRoutes');
const http = require('http');
const { initSocket } = require('./src/config/socket');
const { lockHandler } = require('./src/sockets/lockHandler');

const app = express();

// Middlewares globaux
app.use(cors())
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Connexion BDD
const url = process.env.DB_URL; // Adresse de la bdd in the .env

connectDB(url)

// Routes
app.use('/', authRoutes);
app.use('/', graphRoutes);

const server = http.createServer(app);
const io = initSocket(server);

// Register socket events
io.on('connection', (socket) => {
    console.log(`Client connected : ${socket.id}`);
    lockHandler(io, socket);
});

server.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});