// 📁 /routes/stories-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Story = require("../models/Story");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require('../models/Character');
const Item = require('../models/Item');
const Event = require('../models/Event');
// ... añade aquí todos los modelos que tengan un campo 'stories'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'locations', select: 'name' },
    { path: 'items', select: 'name' }, { path: 'events', select: 'name' },
    { path: 'factions', select: 'name' }, { path: 'abilities', select: 'name' },
    { path: 'powerSystems', select: 'name' }, { path: 'creatures', select: 'name' },
    { path: 'religions', select: 'name' }, { path: 'technologies', select: 'name' },
    { path: 'races', select: 'name' }, { path: 'economies', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todas las historias con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const stories = await Story.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Story.countDocuments({ owner: req.user.userId });
        res.json({
            stories,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving stories", error: error.message });
    }
});

// GET /:id : Obtiene una sola historia
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const story = await Story.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!story) return res.status(404).json({ message: "Story not found" });
        res.json(story);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving story", error: error.message });
    }
});

// POST / : Crea una nueva historia (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Story), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;

        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingStory = await Story.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingStory) return res.status(409).json({ message: `A story named "${name}" already exists in this world.` });

        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newStory = new Story(enrichedBody);
        await newStory.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { stories: newStory._id } });
            }));
        }

        res.status(201).json(newStory);
    } catch (error) {
        res.status(400).json({ message: "Error creating story", error: error.message });
    }
});

// PUT /:id : Actualiza una historia
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params; // ID de la historia que se edita
        const story = await Story.findOne({ _id: id, owner: req.user.userId });
        if (!story) return res.status(404).json({ message: "Story not found or access denied" });

        // CAMBIO: Capturamos 'newlyCreated'
        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, req.user.userId);

        const updatedStory = await Story.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });

        // AÑADIDO: Lógica de vinculación de vuelta
        if (newlyCreated && newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                // Vincula la nueva entidad con esta historia
                return Model.findByIdAndUpdate(item.id, { $push: { stories: id } });
            }));
        }

        res.json(updatedStory);
    } catch (error) {
        console.error("Error updating story:", error);
        res.status(500).json({ message: "Error updating story", error: error.message });
    }
});

// DELETE /:id : Borra una historia y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const storyToDelete = await Story.findOne({ _id: id, owner: req.user.userId });
        if (!storyToDelete) return res.status(404).json({ message: "Story not found" });

        const modelsToClean = [Character, Item, Event]; // Añade aquí otros modelos que tengan un campo 'stories'
        const referenceField = 'stories';

        await Promise.all(modelsToClean.map(Model =>
            Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
        ));

        await Story.findByIdAndDelete(id);
        res.json({ message: "Story deleted successfully and all references cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting story", error: error.message });
    }
});

module.exports = router;
