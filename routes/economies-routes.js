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
// Añade aquí cualquier otro modelo que tenga un campo 'economies'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' },
    { path: 'factions', select: 'name' },
    { path: 'locations', select: 'name' },
    { path: 'items', select: 'name' },
    { path: 'races', select: 'name' },
    { path: 'stories', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todas las economías con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const economies = await Economy.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Economy.countDocuments({ owner: req.user.userId });
        res.json({
            economies,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving economies", error: error.message });
    }
});

// GET /:id : Obtiene una sola economía
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const economy = await Economy.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!economy) return res.status(404).json({ message: "Economy not found" });
        res.json(economy);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving economy", error: error.message });
    }
});

// POST / : Crea una nueva economía (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Economy), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;

        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingEconomy = await Economy.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingEconomy) return res.status(409).json({ message: `An economy named "${name}" already exists in this world.` });

        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newEconomy = new Economy(enrichedBody);
        await newEconomy.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { economies: newEconomy._id } });
            }));
        }

        res.status(201).json(newEconomy);
    } catch (error) {
        res.status(400).json({ message: "Error creating economy", error: error.message });
    }
});

// PUT /:id : Actualiza una economía
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params; // ID de la economía que se edita
        const economy = await Economy.findOne({ _id: id, owner: req.user.userId });
        if (!economy) return res.status(404).json({ message: "Economy not found or access denied" });

        // CAMBIO: Capturamos 'newlyCreated'
        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, req.user.userId);

        const updatedEconomy = await Economy.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });

        // AÑADIDO: Lógica de vinculación de vuelta
        if (newlyCreated && newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                // Vincula la nueva entidad con esta economía
                return Model.findByIdAndUpdate(item.id, { $push: { economies: id } });
            }));
        }

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
        if (!economyToDelete) return res.status(404).json({ message: "Economy not found" });

        const modelsToClean = [Character]; // Añade aquí otros modelos si es necesario
        const referenceField = 'economies';

        await Promise.all(modelsToClean.map(Model =>
            Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
        ));

        await Economy.findByIdAndDelete(id);
        res.json({ message: "Economy deleted successfully and all references cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting economy", error: error.message });
    }
});

module.exports = router;
