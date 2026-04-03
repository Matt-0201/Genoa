const jwt = require("jsonwebtoken");
const { getDB } = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();
        const users = db.collection("users");
        
        let existing_user = await users.findOne({ email: email });
        if (existing_user == null) {
            console.log("hey")
            //const userId = req.body; 
            //const token = jwt.sign({ userId }, process.env.LOGIN_KEY, { expiresIn: "24h" });
            res.send("Utilsateur inconnu, création d'un nouvel utilisateur nécessaire");
        } else {
            if (existing_user.password === password) {
                const name = email.split("@");
                res.send("Bienvenue " + name[0].toString());
            } else {
                res.send("Mot de passe erroné. Veuillez réessayer");
            }
        }
    } catch (err) {
        res.status(500).send("Erreur interne du serveur");
    }
};

exports.getHome = (req, res) => {
    const path = require('path');
    res.sendFile(path.join(__dirname, '../../index.html'));
};