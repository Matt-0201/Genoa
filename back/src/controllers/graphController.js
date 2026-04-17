const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, "../.env")});
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// GET /graph - To get the formated tree
exports.getGraph = async (req, res) => {
    try {
        const db = getDB();
        const allMembers = await db.collection("members").find({}).toArray();
        const allRelations = await db.collection("relationships").find({}).toArray();

        const nodes = allMembers.map((m) => ({
            id: m._id.toString(),
            label: `${m.firstName} ${m.lastName}`,
            data: m
        }));

        const edges = allRelations.map((r) => ({
            source: r.sourceId.toString(),
            target: r.targetId.toString(),
            type: r.type
        }));

        res.status(200).json({
            "success": "true",
            "message": "Arbre récupéré avec succès",
            "nodes": nodes,
            "edges": edges
        });

    } catch(err) {
        res.status(500).json({
            "success": "false",
            "message": "Erreur serveur"
        });
    }
};

// POST /members - To add a member
exports.addMember = async (req, res) => {
    try {
        const db = getDB();
        const members = db.collection("members");

        // Generate a new reference under the format 'Mx' (Member n°x)
        const lastMember = await members.findOne({}, { sort: { ref: -1 } });
        const lastNumber = parseInt(lastMember?.ref?.replace("M", "") || "0");
        const newRef = `M${lastNumber + 1}`;

        const newMember = { ref: newRef, ...req.body };
        const result = await members.insertOne(newMember);

        res.status(201).json({
            "success": "true",
            "message": "Membre ajouté avec succès",
            "id": result.insertedId,
            "ref": newRef
        });

    } catch(err) {
        res.status(500).json({
            "success": "false",
            "message": "Erreur serveur"
        });
    }
};

// PUT /members/:id - Modify a member
exports.updateMember = async (req, res) => {
    try {
        const db = getDB();

        const result = await db.collection("members").updateOne(
            { _id: new ObjectId(req.params.id) },   // What we search
            { $set: req.body }                       // Data to update
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                "success": "false",
                "message": "Membre introuvable"
            });
        }

        res.status(200).json({
            "success": "true",
            "message": "Membre mis à jour avec succès"
        });

    } catch(err) {
        res.status(500).json({
            "success": "false",
            "message": "Erreur serveur"
        });
    }
};

// DELETE /members/:id - Delete a member and its relations
exports.deleteMember = async (req, res) => {
    try {
        const db = getDB();
        const memberId = new ObjectId(req.params.id);

        const result = await db.collection("members").deleteOne({ _id: memberId });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                "success": "false",
                "message": "Membre introuvable"
            });
        }

        // Delete all his relations
        await db.collection("relationships").deleteMany({
            $or: [{ sourceId: memberId }, { targetId: memberId }]
        });

        res.status(200).json({
            "success": "true",
            "message": "Membre et ses relations supprimés avec succès"
        });

    } catch(err) {
        res.status(500).json({
            "success": "false",
            "message": "Erreur serveur"
        });
    }
};

// POST /relationships - To add a relation
exports.addRelationship = async (req, res) => {
    try {
        const db = getDB();
        const { sourceId, targetId, type } = req.body;

        const newRelation = {
            sourceId: new ObjectId(sourceId),
            targetId: new ObjectId(targetId),
            type
        };

        const result = await db.collection("relationships").insertOne(newRelation);

        res.status(201).json({
            "success": "true",
            "message": "Relation ajoutée avec succès",
            "id": result.insertedId
        });

    } catch(err) {
        res.status(500).json({
            "success": "false",
            "message": "Erreur serveur"
        });
    }
};

// DELETE /relationships/:id - To delete a relation
exports.deleteRelationship = async (req, res) => {
    try {
        const db = getDB();

        const result = await db.collection("relationships").deleteOne(
            { _id: new ObjectId(req.params.id) }
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({
                "success": "false",
                "message": "Relation introuvable"
            });
        }

        res.status(200).json({
            "success": "true",
            "message": "Relation supprimée avec succès"
        });

    } catch(err) {
        res.status(500).json({
            "success": "false",
            "message": "Erreur serveur"
        });
    }
};