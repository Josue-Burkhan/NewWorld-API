// 📁 /routes/characters-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Character = require("../models/Character");
const User = require("../models/user-model");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
// Importa todos los modelos que podrían tener una referencia a un 'Character'
const Ability = require('../models/Ability');
const Item = require('../models/Item');
// Añade aquí cualquier otro modelo que tenga campos como 'usedBy', 'createdBy', etc.

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

        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newCharacter = new Character(enrichedBody);
        await newCharacter.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { characters: newCharacter._id } });
            }));
        }
        
        res.status(201).json(newCharacter);
    } catch (error) {
        res.status(500).json({ message: "Error creating character", error: error.message });
    }
});

// PUT /:id : Actualiza un personaje
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const character = await Character.findOne({ _id: id, owner: req.user.userId });
        if (!character) return res.status(404).json({ message: "Character not found or access denied" });

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        
        const updatedCharacter = await Character.findByIdAndUpdate(
            id,
            { $set: enrichedBody },
            { new: true, runValidators: true }
        );

        res.json(updatedCharacter);
    } catch (error) {
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
        
        // 1. Define todos los modelos y los campos que podrían referenciar a un personaje
        const modelsAndFieldsToClean = [
            { model: Character, fields: ['relationships.family', 'relationships.friends', 'relationships.enemies', 'relationships.romance'] },
            { model: Ability, fields: ['characters'] },
            { model: Item, fields: ['characters'] }
        ];

        // 2. Ejecuta la limpieza en paralelo
        await Promise.all(
            modelsAndFieldsToClean.flatMap(item => 
                item.fields.map(field => 
                    item.model.updateMany(
                        { [field]: id },
                        { $pull: { [field]: id } }
                    )
                )
            )
        );

        await Character.findByIdAndDelete(id);
        
        res.json({ message: "Character deleted successfully and all references have been cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting character", error: error.message });
    }
});

module.exports = router;
