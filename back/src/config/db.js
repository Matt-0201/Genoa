const MongoClient = require('mongodb').MongoClient;
let db;

const connectDB = async (url) => {
    try {
        const client = await MongoClient.connect(url);
        db = client.db("genoa");
        console.log("Connecté à MongoDB");
    } catch (err) {
        console.error("Erreur de connexion DB", err);
    }
};

// Fonction pour récupérer l'instance de la DB dans les autres fichiers
const getDB = () => db;

module.exports = { connectDB, getDB };