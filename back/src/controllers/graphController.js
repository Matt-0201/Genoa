const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, "../.env") });
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// --- FONCTION DE RÉCUPÉRATION (Accessible par tous les validés) ---
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
            id: r._id.toString(),
            source: r.sourceId.toString(),
            target: r.targetId.toString(),
            type: r.type
        }));

        res.status(200).json({
            success: "true",
            message: "Arbre récupéré avec succès",
            nodes: nodes,
            edges: edges
        });
    } catch (err) {
        console.error("Erreur getGraph :", err);
        res.status(500).json({ success: "false", message: "Erreur serveur" });
    }
};

// --- FONCTIONS DE MODIFICATION (Réservées Admin et Writer) ---

exports.addMember = async (req, res) => {
    if (req.user.role === 'reader' || req.user.role === 'wait') {
        return res.status(403).json({ message: "Permissions insuffisantes" });
    }
    try {
        const db = getDB();
        const members = db.collection("members");

        const lastMember = await members.findOne({}, { sort: { ref: -1 } });
        const lastNumber = parseInt(lastMember?.ref?.replace("M", "") || "0");
        const newRef = `M${lastNumber + 1}`;

        const newMember = { ref: newRef, ...req.body };
        const result = await members.insertOne(newMember);

        res.status(201).json({
            success: "true",
            message: "Membre ajouté avec succès",
            id: result.insertedId,
            ref: newRef
        });
    } catch (err) {
        res.status(500).json({ success: "false", message: "Erreur serveur" });
    }
};

exports.updateMember = async (req, res) => {
    if (req.user.role === 'reader' || req.user.role === 'wait') {
        return res.status(403).json({ message: "Permissions insuffisantes" });
    }
    try {
        const db = getDB();
        const result = await db.collection("members").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: "false", message: "Membre introuvable" });
        }
        res.status(200).json({ success: "true", message: "Membre mis à jour" });
    } catch (err) {
        res.status(500).json({ success: "false", message: "Erreur serveur" });
    }
};

exports.deleteMember = async (req, res) => {
    if (req.user.role === 'reader' || req.user.role === 'wait') {
        return res.status(403).json({ message: "Permissions insuffisantes" });
    }
    try {
        const db = getDB();
        const memberId = new ObjectId(req.params.id);
        const result = await db.collection("members").deleteOne({ _id: memberId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: "false", message: "Membre introuvable" });
        }

        await db.collection("relationships").deleteMany({
            $or: [{ sourceId: memberId }, { targetId: memberId }]
        });

        res.status(200).json({ success: "true", message: "Membre supprimé" });
    } catch (err) {
        res.status(500).json({ success: "false", message: "Erreur serveur" });
    }
};

exports.addRelationship = async (req, res) => {
    if (req.user.role === 'reader' || req.user.role === 'wait') {
        return res.status(403).json({ message: "Permissions insuffisantes" });
    }
    try {
        const db = getDB();
        const { sourceId, targetId, type } = req.body;
        const newRelation = {
            sourceId: new ObjectId(sourceId),
            targetId: new ObjectId(targetId),
            type
        };
        const result = await db.collection("relationships").insertOne(newRelation);
        res.status(201).json({ success: "true", id: result.insertedId });
    } catch (err) {
        res.status(500).json({ success: "false", message: "Erreur serveur" });
    }
};

exports.deleteRelationship = async (req, res) => {
    if (req.user.role === 'reader' || req.user.role === 'wait') {
        return res.status(403).json({ message: "Permissions insuffisantes" });
    }
    try {
        const db = getDB();
        const result = await db.collection("relationships").deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: "false", message: "Relation introuvable" });
        }
        res.status(200).json({ success: "true", message: "Relation supprimée" });
    } catch (err) {
        res.status(500).json({ success: "false", message: "Erreur serveur" });
    }
};