const path = require('path');
require('dotenv').config();
const fs = require('fs');
const { MongoClient } = require('mongodb');

const url = process.env.DB_URL;
const dbName = "genoa";

async function initMembers() {
    const client = new MongoClient(url);
    try {
        // Connexion to the db
        await client.connect();
        const db = client.db(dbName);
        const members = db.collection("members");
        const relationships = db.collection("relationships");

        // Read members JSON file
        const membersData = fs.readFileSync(path.join(__dirname, "../data/members.json"), 'utf-8');
        const membersImport = JSON.parse(membersData);
        console.log("Members to import:", membersImport);

        // Read relations JSON file
        const relationsData = fs.readFileSync(path.join(__dirname, "../data/relations.json"), 'utf-8');
        const relationsImport = JSON.parse(relationsData);
        console.log("Relations to import:", relationsImport);

        // Map ref → _id MongoDB
        const refToId = {};

        // Members:
        for (const member of membersImport) {
            console.log("Importing member: " + member.firstName + " " + member.lastName);

            const result = await members.findOneAndUpdate(
                { ref: member.ref },            // What we search
                { $set: member },               // Data to insert
                {
                    upsert: true,
                    returnDocument: 'after'
                }
            );

            refToId[member.ref] = result._id;
            console.log(`Membre inséré/mis à jour : ${member.firstName} ${member.lastName} (ref: ${member.ref})`);
        }

        // Relationships:
        for (const relation of relationsImport) {
            const sourceId = refToId[relation.sourceRef];
            const targetId = refToId[relation.targetRef];

            if (!sourceId || !targetId) {
                console.error(`Référence introuvable : ${relation.sourceRef} ou ${relation.targetRef}`);
                continue;
            }

            console.log(`Importing relation: ${relation.sourceRef} --> ${relation.targetRef} (${relation.type})`);

            await relationships.updateOne(
                { sourceId, targetId },         // What we search
                { $set: { sourceId, targetId, type: relation.type } },  // Data to insert
                { upsert: true }                // Create it if needed
            );
        }

    } catch(err) {
        console.error(err);
    } finally {
        console.log("Importation terminée");
        await client.close();
    }
}

initMembers();