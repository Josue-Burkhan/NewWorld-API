// 📁 /routes/factions-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Faction = require("../models/Faction");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
// ... y otros modelos que tengan un campo 'factions'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'allies', select: 'name' },
    { path: 'enemies', select: 'name' }, { path: 'headquarters', select: 'name' },
    { path: 'events', select: 'name' }, { path: 'items', select: 'name' },
    { path: 'stories', select: 'name' }, { path: 'religions', select: 'name' },
    { path: 'languages', select: 'name' }, { path: 'powerSystems', select: 'name' },
    { path: 'territory', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA FACTION ---
async function syncAllReferences(factionId, originalDoc, newDocData) {
    const fieldsToSync = {
        characters: { model: 'Character', inverse: 'factions' },
        allies: { model: 'Faction', inverse: 'allies' },
        enemies: { model: 'Faction', inverse: 'enemies' },
        headquarters: { model: 'Location', inverse: 'factions' }, // Asumiendo que Location puede pertenecer a facciones
        events: { model: 'Event', inverse: 'factions' },
        items: { model: 'Item', inverse: 'factions' },
        stories: { model: 'Story', inverse: 'factions' },
        religions: { model: 'Religion', inverse: 'factions' },
        languages: { model: 'Language', inverse: 'factions' },
        powerSystems: { model: 'PowerSystem', inverse: 'factions' },
        territory: { model: 'Location', inverse: 'factions' },
    };
    const updatePromises = [];

    for (const fieldPath in fieldsToSync) {
        const { model: modelName, inverse: inverseFieldName } = fieldsToSync[fieldPath];
        const Model = mongoose.model(modelName);
        
        const getRefs = (doc) => (doc?.[fieldPath] || []).map(ref => ref.toString());

        const originalRefs = getRefs(originalDoc);
        const newRefs = getRefs(newDocData);

        const toAdd = newRefs.filter(id => !originalRefs.includes(id));
        const toRemove = originalRefs.filter(id => !newRefs.includes(id));

        if (toAdd.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: factionId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: factionId } })
            );
        }
    }
    await Promise.all(updatePromises);
}


// --- ROUTES ---

// GET / : Obtiene todas las facciones con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const factions = await Faction.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Faction.countDocuments({ owner: req.user.userId });
        res.json({ factions, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving factions", error: error.message });
    }
});

// GET /:id : Obtiene una sola facción
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const faction = await Faction.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!faction) return res.status(404).json({ message: "Faction not found" });
        res.json(faction);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving faction", error: error.message });
    }
});

// POST / : Crea una nueva facción
router.post("/", authMiddleware, enforceLimit(Faction), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingFaction = await Faction.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingFaction) return res.status(409).json({ message: `A faction named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newFaction = new Faction(enrichedBody);
        await newFaction.save();

        await syncAllReferences(newFaction._id, null, newFaction);

        const populatedFaction = await Faction.findById(newFaction._id).populate(populationPaths);
        res.status(201).json(populatedFaction);
    } catch (error) {
        console.error("Error creating faction:", error);
        res.status(500).json({ message: "Error creating faction", error: error.message });
    }
});

// PUT /:id : Actualiza una facción
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalFaction = await Faction.findById(id).lean();
        if (!originalFaction || originalFaction.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Faction not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Faction.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalFaction, enrichedBody);

        const updatedFaction = await Faction.findById(id).populate(populationPaths);
        res.json(updatedFaction);
    } catch (error) {
        console.error("Error updating faction:", error);
        res.status(500).json({ message: "Error updating faction", error: error.message });
    }
});

// DELETE /:id : Borra una facción y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const factionToDelete = await Faction.findOne({ _id: id, owner: req.user.userId });
        if (!factionToDelete) return res.status(404).json({ message: "Faction not found or access denied" });
        
        await syncAllReferences(id, factionToDelete, null);
        await Faction.findByIdAndDelete(id);

        res.json({ message: "Faction deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting faction:", error);
        res.status(500).json({ message: "Error deleting faction", error: error.message });
    }
});

module.exports = router;
