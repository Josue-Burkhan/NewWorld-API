// 📁 /routes/economies-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Economy = require("../models/Economy");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
// ... y otros modelos que tengan un campo 'economies'.

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' },
    { path: 'factions', select: 'name' },
    { path: 'locations', select: 'name' },
    { path: 'items', select: 'name' },
    { path: 'races', select: 'name' },
    { path: 'stories', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA ECONOMY ---
async function syncAllReferences(economyId, originalDoc, newDocData) {
    const fieldsToSync = {
        characters: 'Character', factions: 'Faction', locations: 'Location',
        items: 'Item', races: 'Race', stories: 'Story'
    };
    const updatePromises = [];
    const inverseFieldName = 'economies'; // El campo en los otros modelos es 'economies'

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
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: economyId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: economyId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todas las economías con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const economies = await Economy.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Economy.countDocuments({ owner: req.user.userId });
        res.json({ economies, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving economies", error: error.message });
    }
});

// GET /:id : Obtiene una sola economía
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const economy = await Economy.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!economy) return res.status(404).json({ message: "Economy not found" });
        res.json(economy);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving economy", error: error.message });
    }
});

// POST / : Crea una nueva economía
router.post("/", authMiddleware, enforceLimit(Economy), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingEconomy = await Economy.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingEconomy) return res.status(409).json({ message: `An economy named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newEconomy = new Economy(enrichedBody);
        await newEconomy.save();

        await syncAllReferences(newEconomy._id, null, newEconomy);

        const populatedEconomy = await Economy.findById(newEconomy._id).populate(populationPaths);
        res.status(201).json(populatedEconomy);
    } catch (error) {
        console.error("Error creating economy:", error);
        res.status(500).json({ message: "Error creating economy", error: error.message });
    }
});

// PUT /:id : Actualiza una economía
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalEconomy = await Economy.findById(id).lean();
        if (!originalEconomy || originalEconomy.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Economy not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Economy.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalEconomy, enrichedBody);

        const updatedEconomy = await Economy.findById(id).populate(populationPaths);
        res.json(updatedEconomy);
    } catch (error) {
        console.error("Error updating economy:", error);
        res.status(500).json({ message: "Error updating economy", error: error.message });
    }
});

// DELETE /:id : Borra una economía y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const economyToDelete = await Economy.findOne({ _id: id, owner: req.user.userId });
        if (!economyToDelete) return res.status(404).json({ message: "Economy not found or access denied" });
        
        await syncAllReferences(id, economyToDelete, null);
        await Economy.findByIdAndDelete(id);

        res.json({ message: "Economy deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting economy:", error);
        res.status(500).json({ message: "Error deleting economy", error: error.message });
    }
});

module.exports = router;
