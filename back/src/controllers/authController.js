const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, "../.env")});
const jwt = require("jsonwebtoken");
const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');

// Complexity for the hash
const saltRounds = 10;

// Route for the login and register
// Same road due to the few infomation needed to register
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();
        const users = db.collection("users");
        let existing_user = await users.findOne({ email: email });

        // We create a user if it does not exist
        if (existing_user == null) {
            console.log("Création d'un nouvel utilisateur")
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);
            // At first connexion, the user is in "wait", he needs to validate his incription by an admin
            const newUser = {
                email: email,
                password: hashedPassword,
                role: "wait"
            }     
            await users.insertOne(newUser);       
            const payload = {email: newUser.email};
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
            res.status(200).json({
                    "success": "true",
                    "message": "Connexion réussie, utilisateur créé",
                    "user": newUser.email,
                    "token": token
                }) 
        // Verify the connexion if already in the ddb
        } else {
            const isValidPassword = await bcrypt.compare(password, existing_user.password);  // We use created salt to compare
            if (isValidPassword) {
                const payload = {email: existing_user.email, role: existing_user.role};
                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
                res.status(200).json({
                    "success": "true",
                    "message": "Connexion réussie, utilisateur retrouvé",
                    "user": req.body.email,
                    "token": token
                })
            // Error if invalid password 
            } else {
                res.status(401).json({
                    "success": "false",
                    "message": "Mot de passe incorrect"
                });
            }
        }
    } catch (err) {
        res.status(500).json({
            "success": "false",
            "message": "Erreur serveur"
        });
    }
};

exports.getHome = (req, res) => {
    const path = require('path');
    // TEMPORAIRE : LIER AVEC LE FRONT EN RENVOYANT UN CERTAIN MESSAGE JSON
    res.sendFile(path.join(__dirname, '../../index.html'));
};

exports.getUsers = async (req, res) => {
    const db = getDB();
    const users = db.collection("users");
    const listUsers = await users.find({}).toArray();
    if (req.body.role == "admin") {
        res.status(200).json({
            "success": "true",
            "message": "Utilisateur admin. Possibilité d'accéder à la ressource"
        });
    } else {
        res.status(500).json({
            "success": "false",
            "message": "Utilisateur nom admin. Accès à la ressource impossible."
        })
    }
}