// 📁 /routes/items-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require("../models/Item");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
const Ability = require('../models/Ability');
// ... y otros modelos que tengan un campo 'items'.

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'createdBy', select: 'name' }, { path: 'usedBy', select: 'name' },
    { path: 'currentOwnerCharacter', select: 'name' }, { path: 'factions', select: 'name' },
    { path: 'events', select: 'name' }, { path: 'stories', select: 'name' },
    { path: 'locations', select: 'name' }, { path: 'religions', select: 'name' },
    { path: 'powerSystems', select: 'name' }, { path: 'languages', select: 'name' },
    { path: 'abilities', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA ITEM ---
async function syncAllReferences(itemId, originalDoc, newDocData) {
    const fieldsToSync = {
        createdBy: 'Character', usedBy: 'Character', currentOwnerCharacter: 'Character',
        factions: 'Faction', events: 'Event', stories: 'Story',
        locations: 'Location', religions: 'Religion', powerSystems: 'PowerSystem',
        languages: 'Language', abilities: 'Ability'
    };
    const updatePromises = [];
    const inverseFieldName = 'items'; // El campo en los otros modelos es 'items'

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
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: itemId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: itemId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todos los ítems con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const items = await Item.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Item.countDocuments({ owner: req.user.userId });
        res.json({ items, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving items", error: error.message });
    }
});

// GET /:id : Obtiene un solo ítem
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const item = await Item.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving item", error: error.message });
    }
});

// POST / : Crea un nuevo ítem
router.post("/", authMiddleware, enforceLimit(Item), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingItem = await Item.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingItem) return res.status(409).json({ message: `An item named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newItem = new Item(enrichedBody);
        await newItem.save();

        await syncAllReferences(newItem._id, null, newItem);

        const populatedItem = await Item.findById(newItem._id).populate(populationPaths);
        res.status(201).json(populatedItem);
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Error creating item", error: error.message });
    }
});

// PUT /:id : Actualiza un ítem
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalItem = await Item.findById(id).lean();
        if (!originalItem || originalItem.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Item not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Item.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalItem, enrichedBody);

        const updatedItem = await Item.findById(id).populate(populationPaths);
        res.json(updatedItem);
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Error updating item", error: error.message });
    }
});

// DELETE /:id : Borra un ítem y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const itemToDelete = await Item.findOne({ _id: id, owner: req.user.userId });
        if (!itemToDelete) return res.status(404).json({ message: "Item not found or access denied" });
        
        await syncAllReferences(id, itemToDelete, null);
        await Item.findByIdAndDelete(id);

        res.json({ message: "Item deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ message: "Error deleting item", error: error.message });
    }
});

module.exports = router;
