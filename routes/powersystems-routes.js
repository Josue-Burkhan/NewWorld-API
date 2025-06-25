// 📁 /routes/powersystems-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PowerSystem = require("../models/PowerSystem");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
const Ability = require("../models/Ability");
// Añade aquí cualquier otro modelo que tenga un campo 'powerSystems'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'abilities', select: 'name' },
    { path: 'factions', select: 'name' }, { path: 'events', select: 'name' },
    { path: 'stories', select: 'name' }, { path: 'creatures', select: 'name' },
    { path: 'religions', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todos los sistemas de poder con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const powerSystems = await PowerSystem.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await PowerSystem.countDocuments({ owner: req.user.userId });
        res.json({
            powerSystems,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving power systems", error: error.message });
    }
});

// GET /:id : Obtiene un solo sistema de poder
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const powerSystem = await PowerSystem.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!powerSystem) return res.status(404).json({ message: "PowerSystem not found" });
        res.json(powerSystem);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving power system", error: error.message });
    }
});

// POST / : Crea un nuevo sistema de poder (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(PowerSystem), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;

        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingPowerSystem = await PowerSystem.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingPowerSystem) return res.status(409).json({ message: `A power system named "${name}" already exists in this world.` });

        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newPowerSystem = new PowerSystem(enrichedBody);
        await newPowerSystem.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { powerSystems: newPowerSystem._id } });
            }));
        }

        res.status(201).json(newPowerSystem);
    } catch (error) {
        res.status(400).json({ message: "Error creating power system", error: error.message });
    }
});

// PUT /:id : Actualiza un sistema de poder
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const powerSystem = await PowerSystem.findOne({ _id: id, owner: req.user.userId });
        if (!powerSystem) return res.status(404).json({ message: "PowerSystem not found or access denied" });

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);

        const updatedPowerSystem = await PowerSystem.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });
        res.json(updatedPowerSystem);
    } catch (error) {
        res.status(400).json({ message: "Error updating power system", error: error.message });
    }
});

// DELETE /:id : Borra un sistema de poder y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const powerSystemToDelete = await PowerSystem.findOne({ _id: id, owner: req.user.userId });
        if (!powerSystemToDelete) return res.status(404).json({ message: "PowerSystem not found" });

        const modelsToClean = [Character, Ability]; // Añade aquí otros modelos que tengan un campo 'powerSystems'
        const referenceField = 'powerSystems';

        await Promise.all(modelsToClean.map(Model =>
            Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
        ));

        await PowerSystem.findByIdAndDelete(id);
        res.json({ message: "PowerSystem deleted successfully and all references cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting power system", error: error.message });
    }
});

module.exports = router;
