const path = require('path');
require('dotenv').config();
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb')

const url = process.env.DB_URL;
console.log(url)
const dbName = "genoa"
const saltRounds = 10;

// Function to insert users:
// Acualise users if new informations or create them  
async function initUsers() {
    const client = new MongoClient(url)
    
    try {
        // Connexion to the db
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection("users")

        // Read the JSON file
        const data = fs.readFileSync(path.join(__dirname, "../data/users.json"), 'utf-8')
        const usersImport = JSON.parse(data);
        console.log(usersImport)
        for (const user of usersImport) {
            console.log("Actual password: " + user.password)
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            user.password = hashedPassword;
            console.log("New password: " + user.password)
            await users.updateOne(
                { email: user.email },    // What we search 
                { $set: user },           // Data to insert
                { upsert: true }          // Create it if needed
            )
        }
    } catch(err) {
        console.error(err);
    } finally {
        console.log("Importation terminé")
        await client.close();
    }
}

initUsers();
