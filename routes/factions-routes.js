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
// Añade aquí cualquier otro modelo que tenga un campo 'factions'

// --- POPULATE HELPER ---
const populationPaths = [
  { path: 'characters', select: 'name' }, { path: 'allies', select: 'name' },
  { path: 'enemies', select: 'name' }, { path: 'headquarters', select: 'name' },
  { path: 'events', select: 'name' }, { path: 'items', select: 'name' },
  { path: 'stories', select: 'name' }, { path: 'religions', select: 'name' },
  { path: 'languages', select: 'name' }, { path: 'powerSystems', select: 'name' },
  { path: 'territory', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todas las facciones con paginación
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'name' } = req.query;
    const factions = await Faction.find({ owner: req.user.userId })
      .populate(populationPaths)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Faction.countDocuments({ owner: req.user.userId });
    res.json({
      factions,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving factions", error: error.message });
  }
});

// GET /:id : Obtiene una sola facción
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const faction = await Faction.findOne({ _id: req.params.id, owner: req.user.userId })
      .populate(populationPaths);
    if (!faction) return res.status(404).json({ message: "Faction not found" });
    res.json(faction);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving faction", error: error.message });
  }
});

// POST / : Crea una nueva facción (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Faction), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, world } = req.body;

    if (!world) return res.status(400).json({ message: "World ID is required." });

    const existingFaction = await Faction.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
    if (existingFaction) return res.status(409).json({ message: `A faction named "${name}" already exists in this world.` });

    const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
    enrichedBody.owner = userId;

    const newFaction = new Faction(enrichedBody);
    await newFaction.save();

    if (newlyCreated.length > 0) {
      await Promise.all(newlyCreated.map(item => {
        const Model = mongoose.model(item.model);
        return Model.findByIdAndUpdate(item.id, { $push: { factions: newFaction._id } });
      }));
    }

    res.status(201).json(newFaction);
  } catch (error) {
    res.status(400).json({ message: "Error creating faction", error: error.message });
  }
});

// PUT /:id : Actualiza una facción
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // ID de la facción que se edita
    const faction = await Faction.findOne({ _id: id, owner: req.user.userId });
    if (!faction) return res.status(404).json({ message: "Faction not found or access denied" });

    // CAMBIO: Capturamos 'newlyCreated'
    const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, req.user.userId);

    const updatedFaction = await Faction.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });

    // AÑADIDO: Lógica de vinculación de vuelta
    if (newlyCreated && newlyCreated.length > 0) {
      await Promise.all(newlyCreated.map(item => {
        const Model = mongoose.model(item.model);
        // Vincula la nueva entidad con esta facción
        return Model.findByIdAndUpdate(item.id, { $push: { factions: id } });
      }));
    }

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
    if (!factionToDelete) return res.status(404).json({ message: "Faction not found" });

    const modelsToClean = [Character, Faction]; // Faction se limpia a sí misma (allies, enemies)
    const referenceFields = ['factions', 'allies', 'enemies']; // Campos a limpiar

    await Promise.all(
      modelsToClean.flatMap(Model =>
        referenceFields.map(field =>
          Model.updateMany({ [field]: id }, { $pull: { [field]: id } })
        )
      )
    );

    await Faction.findByIdAndDelete(id);
    res.json({ message: "Faction deleted successfully and all references cleaned." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting faction", error: error.message });
  }
});

module.exports = router;
