const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, "../.env")});
const jwt = require("jsonwebtoken");
const { getDB } = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();
        const users = db.collection("users");
        let existing_user = await users.findOne({ email: email });
        if (existing_user == null) {
            // CHANGER : METTRE USER + ROLE + ISCONNECTED DANS LE PAYLOD
            // ET AJOUTER USER DANS DB
            const payload = {email: req.body.email};
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
            res.status(200).json({
                    "success": "true",
                    "message": "Connexion réussie, utilisateur créé",
                    "user": req.body.email,
                    "token": token
                }) 
        } else {
            if (existing_user.password === password) { // Temporaire, comparer avec une version cryptée du mdp
                const payload = {email: existing_user.email, role: existing_user.role};
                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
                res.status(200).json({
                    "success": "true",
                    "message": "Connexion réussie, utilisateur retrouvé",
                    "user": req.body.email,
                    "token": token
                })
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