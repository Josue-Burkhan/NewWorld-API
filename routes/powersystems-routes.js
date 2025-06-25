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
// ... y otros modelos que tengan un campo 'powerSystems'.

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'abilities', select: 'name' },
    { path: 'factions', select: 'name' }, { path: 'events', select: 'name' },
    { path: 'stories', select: 'name' }, { path: 'creatures', select: 'name' },
    { path: 'religions', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA POWERSYSTEM ---
async function syncAllReferences(powerSystemId, originalDoc, newDocData) {
    const fieldsToSync = {
        characters: 'Character', abilities: 'Ability', factions: 'Faction',
        events: 'Event', stories: 'Story', creatures: 'Creature', religions: 'Religion'
    };
    const updatePromises = [];
    const inverseFieldName = 'powerSystems'; // El campo en los otros modelos es 'powerSystems'

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
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: powerSystemId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: powerSystemId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todos los sistemas de poder con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const powerSystems = await PowerSystem.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await PowerSystem.countDocuments({ owner: req.user.userId });
        res.json({ powerSystems, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving power systems", error: error.message });
    }
});

// GET /:id : Obtiene un solo sistema de poder
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const powerSystem = await PowerSystem.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!powerSystem) return res.status(404).json({ message: "PowerSystem not found" });
        res.json(powerSystem);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving power system", error: error.message });
    }
});

// POST / : Crea un nuevo sistema de poder
router.post("/", authMiddleware, enforceLimit(PowerSystem), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingPowerSystem = await PowerSystem.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingPowerSystem) return res.status(409).json({ message: `A power system named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newPowerSystem = new PowerSystem(enrichedBody);
        await newPowerSystem.save();

        await syncAllReferences(newPowerSystem._id, null, newPowerSystem);

        const populatedPowerSystem = await PowerSystem.findById(newPowerSystem._id).populate(populationPaths);
        res.status(201).json(populatedPowerSystem);
    } catch (error) {
        console.error("Error creating power system:", error);
        res.status(500).json({ message: "Error creating power system", error: error.message });
    }
});

// PUT /:id : Actualiza un sistema de poder
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalPowerSystem = await PowerSystem.findById(id).lean();
        if (!originalPowerSystem || originalPowerSystem.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "PowerSystem not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await PowerSystem.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalPowerSystem, enrichedBody);

        const updatedPowerSystem = await PowerSystem.findById(id).populate(populationPaths);
        res.json(updatedPowerSystem);
    } catch (error) {
        console.error("Error updating power system:", error);
        res.status(500).json({ message: "Error updating power system", error: error.message });
    }
});

// DELETE /:id : Borra un sistema de poder y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const powerSystemToDelete = await PowerSystem.findOne({ _id: id, owner: req.user.userId });
        if (!powerSystemToDelete) return res.status(404).json({ message: "PowerSystem not found or access denied" });
        
        await syncAllReferences(id, powerSystemToDelete, null);
        await PowerSystem.findByIdAndDelete(id);

        res.json({ message: "PowerSystem deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting power system:", error);
        res.status(500).json({ message: "Error deleting power system", error: error.message });
    }
});

module.exports = router;
