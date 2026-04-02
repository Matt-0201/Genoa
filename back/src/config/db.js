const dotenv = require('dotenv');
dotenv.config();
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://admin:password@localhost:27017';
let db;

const connectDB = async () => {
    try {
        const client = await MongoClient.connect(url);
        db = client.db("genoa");
        console.log("Connecté à MongoDB");
    } catch (err) {
        console.error("Erreur de connexion DB", err);
    }
};

// Fonction pour récupérer l'instance de la DB dans les autres fichiers
const getDb = () => db;

module.exports = { connectDB, getDb };