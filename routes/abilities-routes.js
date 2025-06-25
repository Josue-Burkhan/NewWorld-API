// 📁 /routes/abilities-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Ability = require("../models/Ability");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
const Creature = require("../models/Creature");
// ... y otros modelos que puedan tener un campo 'abilities'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'powerSystems', select: 'name' },
    { path: 'stories', select: 'name' }, { path: 'events', select: 'name' },
    { path: 'items', select: 'name' }, { path: 'technologies', select: 'name' },
    { path: 'creatures', select: 'name' }, { path: 'religions', select: 'name' },
    { path: 'races', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA ABILITY ---
async function syncAllReferences(abilityId, originalDoc, newDocData) {
    const fieldsToSync = {
        characters: 'Character', powerSystems: 'PowerSystem', stories: 'Story',
        events: 'Event', items: 'Item', technologies: 'Technology',
        creatures: 'Creature', religions: 'Religion', races: 'Race'
    };
    const updatePromises = [];
    const inverseFieldName = 'abilities'; // El campo en los otros modelos es 'abilities'

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
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: abilityId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: abilityId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todas las habilidades con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const abilities = await Ability.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Ability.countDocuments({ owner: req.user.userId });
        res.json({ abilities, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving abilities", error: error.message });
    }
});

// GET /:id : Obtiene una sola habilidad
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ability ID" });
        }
        const ability = await Ability.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!ability) return res.status(404).json({ message: "Ability not found or access denied" });
        res.json(ability);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving ability", error: error.message });
    }
});

// POST / : Crea una nueva habilidad
router.post("/", authMiddleware, enforceLimit(Ability), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingAbility = await Ability.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingAbility) return res.status(409).json({ message: `An ability named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newAbility = new Ability(enrichedBody);
        await newAbility.save();

        await syncAllReferences(newAbility._id, null, newAbility);

        const populatedAbility = await Ability.findById(newAbility._id).populate(populationPaths);
        res.status(201).json(populatedAbility);
    } catch (error) {
        console.error("Error creating ability:", error);
        res.status(500).json({ message: "Error creating ability", error: error.message });
    }
});

// PUT /:id : Actualiza una habilidad
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalAbility = await Ability.findById(id).lean();
        if (!originalAbility || originalAbility.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Ability not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Ability.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalAbility, enrichedBody);

        const updatedAbility = await Ability.findById(id).populate(populationPaths);
        res.json(updatedAbility);
    } catch (error) {
        console.error("Error updating ability:", error);
        res.status(500).json({ message: "Error updating ability", error: error.message });
    }
});

// DELETE /:id : Borra una habilidad y limpia TODAS las referencias de forma universal
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const abilityToDelete = await Ability.findOne({ _id: id, owner: req.user.userId });
        if (!abilityToDelete) {
            return res.status(404).json({ message: "Ability not found or access denied" });
        }
        
        await syncAllReferences(id, abilityToDelete, null);
        await Ability.findByIdAndDelete(id);

        res.json({ message: "Ability deleted successfully and all references have been cleaned." });
    } catch (error) {
        console.error("Error deleting ability:", error);
        res.status(500).json({ message: "Error deleting ability", error: error.message });
    }
});

module.exports = router;
