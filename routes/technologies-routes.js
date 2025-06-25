// 📁 /routes/technologies-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Technology = require("../models/Technology");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
const Item = require("../models/Item");
// Añade aquí cualquier otro modelo que tenga un campo 'technologies'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'creators', select: 'name' }, { path: 'characters', select: 'name' },
    { path: 'factions', select: 'name' }, { path: 'items', select: 'name' },
    { path: 'events', select: 'name' }, { path: 'stories', select: 'name' },
    { path: 'locations', select: 'name' }, { path: 'powerSystems', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todas las tecnologías con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const technologies = await Technology.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Technology.countDocuments({ owner: req.user.userId });
        res.json({
            technologies,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving technologies", error: error.message });
    }
});

// GET /:id : Obtiene una sola tecnología
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const technology = await Technology.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!technology) return res.status(404).json({ message: "Technology not found" });
        res.json(technology);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving technology", error: error.message });
    }
});

// POST / : Crea una nueva tecnología (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Technology), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;

        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingTechnology = await Technology.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingTechnology) return res.status(409).json({ message: `A technology named "${name}" already exists in this world.` });

        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newTechnology = new Technology(enrichedBody);
        await newTechnology.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { technologies: newTechnology._id } });
            }));
        }

        res.status(201).json(newTechnology);
    } catch (error) {
        res.status(400).json({ message: "Error creating technology", error: error.message });
    }
});

// PUT /:id : Actualiza una tecnología
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const technology = await Technology.findOne({ _id: id, owner: req.user.userId });
        if (!technology) return res.status(404).json({ message: "Technology not found or access denied" });

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);

        const updatedTechnology = await Technology.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });
        res.json(updatedTechnology);
    } catch (error) {
        res.status(400).json({ message: "Error updating technology", error: error.message });
    }
});

// DELETE /:id : Borra una tecnología y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const technologyToDelete = await Technology.findOne({ _id: id, owner: req.user.userId });
        if (!technologyToDelete) return res.status(404).json({ message: "Technology not found" });

        const modelsToClean = [Character, Item]; // Añade aquí otros modelos que tengan un campo 'technologies'
        const referenceField = 'technologies';

        await Promise.all(modelsToClean.map(Model =>
            Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
        ));

        await Technology.findByIdAndDelete(id);
        res.json({ message: "Technology deleted successfully and all references cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting technology", error: error.message });
    }
});

module.exports = router;
