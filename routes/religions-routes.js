// � /routes/religions-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Religion = require("../models/Religion");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
const Faction = require("../models/Faction");
// ... y otros modelos que tengan un campo 'religions'.

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'factions', select: 'name' },
    { path: 'locations', select: 'name' }, { path: 'creatures', select: 'name' },
    { path: 'events', select: 'name' }, { path: 'powerSystems', select: 'name' },
    { path: 'stories', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA RELIGION ---
async function syncAllReferences(religionId, originalDoc, newDocData) {
    const fieldsToSync = {
        characters: 'Character', factions: 'Faction', locations: 'Location',
        creatures: 'Creature', events: 'Event', powerSystems: 'PowerSystem',
        stories: 'Story'
    };
    const updatePromises = [];
    const inverseFieldName = 'religions'; // El campo en los otros modelos es 'religions'

    for (const fieldPath in fieldsToSync) {
        const modelName = fieldsToSync[fieldPath];
        const Model = mongoose.model(modelName);

        const getRefs = (doc) => (doc?.[fieldPath] || []).map(ref => ref.toString());

        const originalRefs = getRefs(originalDoc);
        const newRefs = getRefs(newDocData);

        const toAdd = newRefs.filter(id => !originalRefs.includes(id));
        const toRemove = originalRefs.filter(id => !newRefs.includes(id));

        if (toAdd.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: religionId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: religionId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todas las religiones con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const religions = await Religion.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Religion.countDocuments({ owner: req.user.userId });
        res.json({ religions, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving religions", error: error.message });
    }
});

// GET /:id : Obtiene una sola religión
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const religion = await Religion.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!religion) return res.status(404).json({ message: "Religion not found" });
        res.json(religion);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving religion", error: error.message });
    }
});

// POST / : Crea una nueva religión
router.post("/", authMiddleware, enforceLimit(Religion), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingReligion = await Religion.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingReligion) return res.status(409).json({ message: `A religion named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newReligion = new Religion(enrichedBody);
        await newReligion.save();

        await syncAllReferences(newReligion._id, null, newReligion);

        const populatedReligion = await Religion.findById(newReligion._id).populate(populationPaths);
        res.status(201).json(populatedReligion);
    } catch (error) {
        console.error("Error creating religion:", error);
        res.status(500).json({ message: "Error creating religion", error: error.message });
    }
});

// PUT /:id : Actualiza una religión
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalReligion = await Religion.findById(id).lean();
        if (!originalReligion || originalReligion.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Religion not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Religion.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalReligion, enrichedBody);

        const updatedReligion = await Religion.findById(id).populate(populationPaths);
        res.json(updatedReligion);
    } catch (error) {
        console.error("Error updating religion:", error);
        res.status(500).json({ message: "Error updating religion", error: error.message });
    }
});

// DELETE /:id : Borra una religión y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const religionToDelete = await Religion.findOne({ _id: id, owner: req.user.userId });
        if (!religionToDelete) return res.status(404).json({ message: "Religion not found or access denied" });

        await syncAllReferences(id, religionToDelete, null);
        await Religion.findByIdAndDelete(id);

        res.json({ message: "Religion deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting religion:", error);
        res.status(500).json({ message: "Error deleting religion", error: error.message });
    }
});

module.exports = router;
