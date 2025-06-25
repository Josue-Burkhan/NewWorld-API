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
// Añade aquí cualquier otro modelo que tenga un campo 'items'

// --- POPULATE HELPER ---
const populationPaths = [
  { path: 'createdBy', select: 'name' }, { path: 'usedBy', select: 'name' },
  { path: 'currentOwnerCharacter', select: 'name' }, { path: 'factions', select: 'name' },
  { path: 'events', select: 'name' }, { path: 'stories', select: 'name' },
  { path: 'locations', select: 'name' }, { path: 'religions', select: 'name' },
  { path: 'powerSystems', select: 'name' }, { path: 'languages', select: 'name' },
  { path: 'abilities', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todos los ítems con paginación
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'name' } = req.query;
    const items = await Item.find({ owner: req.user.userId })
      .populate(populationPaths)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Item.countDocuments({ owner: req.user.userId });
    res.json({
      items,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving items", error: error.message });
  }
});

// GET /:id : Obtiene un solo ítem
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.userId })
      .populate(populationPaths);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving item", error: error.message });
  }
});

// POST / : Crea un nuevo ítem (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Item), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, world } = req.body;

    if (!world) return res.status(400).json({ message: "World ID is required." });

    const existingItem = await Item.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
    if (existingItem) return res.status(409).json({ message: `An item named "${name}" already exists in this world.` });

    const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
    enrichedBody.owner = userId;

    const newItem = new Item(enrichedBody);
    await newItem.save();

    if (newlyCreated.length > 0) {
      await Promise.all(newlyCreated.map(item => {
        const Model = mongoose.model(item.model);
        return Model.findByIdAndUpdate(item.id, { $push: { items: newItem._id } });
      }));
    }

    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: "Error creating item", error: error.message });
  }
});

// PUT /:id : Actualiza un ítem
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // ID del ítem que se edita
    const item = await Item.findOne({ _id: id, owner: req.user.userId });
    if (!item) return res.status(404).json({ message: "Item not found or access denied" });

    // CAMBIO: Capturamos 'newlyCreated'
    const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, req.user.userId);

    const updatedItem = await Item.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });

    // AÑADIDO: Lógica de vinculación de vuelta
    if (newlyCreated && newlyCreated.length > 0) {
      await Promise.all(newlyCreated.map(item => {
        const Model = mongoose.model(item.model);
        // Vincula la nueva entidad con este ítem
        return Model.findByIdAndUpdate(item.id, { $push: { items: id } });
      }));
    }

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
    if (!itemToDelete) return res.status(404).json({ message: "Item not found" });

    const modelsToClean = [Character, Ability]; // Añade aquí otros modelos que tengan un campo 'items'
    const referenceField = 'items';

    await Promise.all(modelsToClean.map(Model =>
      Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
    ));

    await Item.findByIdAndDelete(id);
    res.json({ message: "Item deleted successfully and all references cleaned." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error: error.message });
  }
});

module.exports = router;
