// 📁 /routes/creatures-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Creature = require("../models/Creature");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
// Añade aquí cualquier otro modelo que tenga un campo 'creatures'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'factions', select: 'name' },
    { path: 'events', select: 'name' },     { path: 'stories', select: 'name' },
    { path: 'locations', select: 'name' },  { path: 'powerSystems', select: 'name' },
    { path: 'religions', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todas las criaturas con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const creatures = await Creature.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        
        const count = await Creature.countDocuments({ owner: req.user.userId });
        res.json({
            creatures,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving creatures", error: error.message });
    }
});

// GET /:id : Obtiene una sola criatura
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const creature = await Creature.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!creature) return res.status(404).json({ message: "Creature not found" });
        res.json(creature);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving creature", error: error.message });
    }
});

// POST / : Crea una nueva criatura (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Creature), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        
        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingCreature = await Creature.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingCreature) return res.status(409).json({ message: `A creature named "${name}" already exists in this world.` });
        
        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newCreature = new Creature(enrichedBody);
        await newCreature.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { creatures: newCreature._id } });
            }));
        }
        
        res.status(201).json(newCreature);
    } catch (error) {
        res.status(400).json({ message: "Error creating creature", error: error.message });
    }
});

// PUT /:id : Actualiza una criatura
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const creature = await Creature.findOne({ _id: id, owner: req.user.userId });
        if (!creature) return res.status(404).json({ message: "Creature not found or access denied" });

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        
        const updatedCreature = await Creature.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });
        res.json(updatedCreature);
    } catch (error) {
        res.status(400).json({ message: "Error updating creature", error: error.message });
    }
});

// DELETE /:id : Borra una criatura y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const creatureToDelete = await Creature.findOne({ _id: id, owner: req.user.userId });
        if (!creatureToDelete) return res.status(404).json({ message: "Creature not found" });

        const modelsToClean = [Character]; // Añade aquí otros modelos si es necesario
        const referenceField = 'creatures';

        await Promise.all(modelsToClean.map(Model => 
            Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
        ));

        await Creature.findByIdAndDelete(id);
        res.json({ message: "Creature deleted successfully and all references cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting creature", error: error.message });
    }
});

module.exports = router;
