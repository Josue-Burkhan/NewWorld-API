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
// ... y otros modelos que tengan un campo 'technologies'.

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'creators', select: 'name' }, { path: 'characters', select: 'name' },
    { path: 'factions', select: 'name' }, { path: 'items', select: 'name' },
    { path: 'events', select: 'name' }, { path: 'stories', select: 'name' },
    { path: 'locations', select: 'name' }, { path: 'powerSystems', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA TECHNOLOGY ---
async function syncAllReferences(technologyId, originalDoc, newDocData) {
    const fieldsToSync = {
        creators: 'Character', characters: 'Character', factions: 'Faction',
        items: 'Item', events: 'Event', stories: 'Story',
        locations: 'Location', powerSystems: 'PowerSystem'
    };
    const updatePromises = [];
    // Nota: El campo inverso puede variar, así que lo manejamos dinámicamente.
    const getInverseField = (field) => {
        if (field === 'creators') return 'technologies'; // Asumiendo que Character tiene un campo 'technologies'
        return 'technologies'; // Default para todos los demás
    };

    for (const fieldPath in fieldsToSync) {
        const modelName = fieldsToSync[fieldPath];
        const Model = mongoose.model(modelName);

        const getRefs = (doc) => (doc?.[fieldPath] || []).map(ref => ref.toString());

        const originalRefs = getRefs(originalDoc);
        const newRefs = getRefs(newDocData);

        const toAdd = newRefs.filter(id => !originalRefs.includes(id));
        const toRemove = originalRefs.filter(id => !newRefs.includes(id));

        const inverseFieldName = getInverseField(fieldPath);

        if (toAdd.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: technologyId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: technologyId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todas las tecnologías con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const technologies = await Technology.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Technology.countDocuments({ owner: req.user.userId });
        res.json({ technologies, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving technologies", error: error.message });
    }
});

// GET /:id : Obtiene una sola tecnología
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const technology = await Technology.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!technology) return res.status(404).json({ message: "Technology not found" });
        res.json(technology);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving technology", error: error.message });
    }
});

// POST / : Crea una nueva tecnología
router.post("/", authMiddleware, enforceLimit(Technology), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingTechnology = await Technology.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingTechnology) return res.status(409).json({ message: `A technology named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newTechnology = new Technology(enrichedBody);
        await newTechnology.save();

        await syncAllReferences(newTechnology._id, null, newTechnology);

        const populatedTechnology = await Technology.findById(newTechnology._id).populate(populationPaths);
        res.status(201).json(populatedTechnology);
    } catch (error) {
        console.error("Error creating technology:", error);
        res.status(500).json({ message: "Error creating technology", error: error.message });
    }
});

// PUT /:id : Actualiza una tecnología
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalTechnology = await Technology.findById(id).lean();
        if (!originalTechnology || originalTechnology.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Technology not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Technology.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalTechnology, enrichedBody);

        const updatedTechnology = await Technology.findById(id).populate(populationPaths);
        res.json(updatedTechnology);
    } catch (error) {
        console.error("Error updating technology:", error);
        res.status(500).json({ message: "Error updating technology", error: error.message });
    }
});

// DELETE /:id : Borra una tecnología y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const technologyToDelete = await Technology.findOne({ _id: id, owner: req.user.userId });
        if (!technologyToDelete) return res.status(404).json({ message: "Technology not found or access denied" });

        await syncAllReferences(id, technologyToDelete, null);
        await Technology.findByIdAndDelete(id);

        res.json({ message: "Technology deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting technology:", error);
        res.status(500).json({ message: "Error deleting technology", error: error.message });
    }
});

module.exports = router;
