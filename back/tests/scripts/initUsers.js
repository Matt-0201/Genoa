const path = require('path');
require('dotenv').config();
const fs = require('fs')
const { MongoClient } = require('mongodb')

const url = process.env.DB_URL;
console.log(url)
const dbName = "genoa"

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
