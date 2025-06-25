// 📁 /routes/characters-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Character = require("../models/Character");
const User = require("../models/user-model");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Ability = require('../models/Ability');
const Item = require('../models/Item');
// ... y otros modelos que puedas necesitar.

// --- UTILITY ---
async function canCreateCharacter(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    const characterCount = await Character.countDocuments({ owner: userId });
    switch ((user.plan || "").toLowerCase()) {
        case "free": return characterCount < 80;
        case "premium": return characterCount < 505;
        case "creator of worlds": return true;
        default: return false;
    }
}

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'abilities', select: 'name' }, { path: 'items', select: 'name' },
    { path: 'languages', select: 'name' }, { path: 'races', select: 'name' },
    { path: 'factions', select: 'name' }, { path: 'locations', select: 'name' },
    { path: 'powerSystems', select: 'name' }, { path: 'religions', select: 'name' },
    { path: 'creatures', select: 'name' }, { path: 'economies', select: 'name' },
    { path: 'stories', select: 'name' },
    { path: 'relationships.family', select: 'name' }, { path: 'relationships.friends', select: 'name' },
    { path: 'relationships.enemies', select: 'name' }, { path: 'relationships.romance', select: 'name' }
];

// --- NUEVA FUNCIÓN AUXILIAR DE SINCRONIZACIÓN ---
// Centraliza la lógica para vincular y desvincular referencias bidireccionalmente.
async function syncAllReferences(characterId, originalDoc, newDocData) {
    const fieldsToSync = {
        abilities: 'Ability', items: 'Item', languages: 'Language',
        races: 'Race', factions: 'Faction', locations: 'Location',
        powerSystems: 'PowerSystem', religions: 'Religion', creatures: 'Creature',
        economies: 'Economy', stories: 'Story', 'relationships.family': 'Character',
        'relationships.friends': 'Character', 'relationships.enemies': 'Character',
        'relationships.romance': 'Character',
    };

    const updatePromises = [];

    for (const fieldPath in fieldsToSync) {
        const modelName = fieldsToSync[fieldPath];
        const Model = mongoose.model(modelName);
        const [parentField, childField] = fieldPath.includes('.') ? fieldPath.split('.') : [null, fieldPath];

        const getRefs = (doc) => {
            if (!doc) return [];
            const target = parentField ? doc[parentField] : doc;
            return (target?.[childField] || []).map(ref => ref.toString());
        };

        const originalRefs = getRefs(originalDoc);
        const newRefs = getRefs(newDocData);

        const toAdd = newRefs.filter(id => !originalRefs.includes(id));
        const toRemove = originalRefs.filter(id => !newRefs.includes(id));

        const inverseField = parentField === 'relationships' ? childField : 'characters';

        if (toAdd.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseField]: characterId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseField]: characterId } })
            );
        }
    }

    await Promise.all(updatePromises);
}


// --- ROUTES ---

// GET / : Obtiene todos los personajes con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const characters = await Character.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        const count = await Character.countDocuments({ owner: req.user.userId });
        res.json({
            characters,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving characters", error: error.message });
    }
});

// GET /:id : Obtiene un solo personaje
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid character ID" });
        }
        const character = await Character.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!character) return res.status(404).json({ message: "Character not found or access denied" });
        res.json(character);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving character", error: error.message });
    }
});

// POST / : Crea un nuevo personaje
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;

        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingCharacter = await Character.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingCharacter) return res.status(409).json({ message: `A character named "${name}" already exists in this world.` });

        const allowed = await canCreateCharacter(userId);
        if (!allowed) return res.status(403).json({ message: "Character creation limit reached." });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newCharacter = new Character(enrichedBody);
        await newCharacter.save();

        await syncAllReferences(newCharacter._id, null, newCharacter);

        const populatedCharacter = await Character.findById(newCharacter._id).populate(populationPaths);
        res.status(201).json(populatedCharacter);
    } catch (error) {
        console.error("Error creating character:", error);
        res.status(500).json({ message: "Error creating character", error: error.message });
    }
});

// PUT /:id : Actualiza un personaje
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const originalCharacter = await Character.findById(id).lean();
        if (!originalCharacter || originalCharacter.owner.toString() !== userId) {
            return res.status(404).json({ message: "Character not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);

        await Character.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalCharacter, enrichedBody);

        const updatedCharacter = await Character.findById(id).populate(populationPaths);
        res.json(updatedCharacter);
    } catch (error) {
        console.error("Error updating character:", error);
        res.status(500).json({ message: "Error updating character", error: error.message });
    }
});

// DELETE /:id : Borra un personaje y limpia TODAS las referencias de forma universal
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const characterToDelete = await Character.findOne({ _id: id, owner: req.user.userId });
        if (!characterToDelete) {
            return res.status(404).json({ message: "Character not found or access denied" });
        }
        await syncAllReferences(id, characterToDelete, null);

        await Character.findByIdAndDelete(id);

        res.json({ message: "Character deleted successfully and all references have been cleaned." });
    } catch (error) {
        console.error("Error deleting character:", error);
        res.status(500).json({ message: "Error deleting character", error: error.message });
    }
});

module.exports = router;
