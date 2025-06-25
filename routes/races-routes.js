// 📁 /routes/races-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Race = require("../models/Race");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
// Añade aquí cualquier otro modelo que tenga un campo 'races'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'languages', select: 'name' },    { path: 'characters', select: 'name' },
    { path: 'locations', select: 'name' },    { path: 'religions', select: 'name' },
    { path: 'stories', select: 'name' },      { path: 'events', select: 'name' },
    { path: 'powerSystems', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todas las razas con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const races = await Race.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        
        const count = await Race.countDocuments({ owner: req.user.userId });
        res.json({
            races,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving races", error: error.message });
    }
});

// GET /:id : Obtiene una sola raza
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const race = await Race.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!race) return res.status(404).json({ message: "Race not found" });
        res.json(race);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving race", error: error.message });
    }
});

// POST / : Crea una nueva raza (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Race), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        
        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingRace = await Race.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingRace) return res.status(409).json({ message: `A race named "${name}" already exists in this world.` });
        
        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newRace = new Race(enrichedBody);
        await newRace.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { races: newRace._id } });
            }));
        }
        
        res.status(201).json(newRace);
    } catch (error) {
        res.status(400).json({ message: "Error creating race", error: error.message });
    }
});

// PUT /:id : Actualiza una raza
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const race = await Race.findOne({ _id: id, owner: req.user.userId });
        if (!race) return res.status(404).json({ message: "Race not found or access denied" });

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        
        const updatedRace = await Race.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });
        res.json(updatedRace);
    } catch (error) {
        res.status(400).json({ message: "Error updating race", error: error.message });
    }
});

// DELETE /:id : Borra una raza y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const raceToDelete = await Race.findOne({ _id: id, owner: req.user.userId });
        if (!raceToDelete) return res.status(404).json({ message: "Race not found" });

        const modelsToClean = [Character]; // Añade aquí otros modelos que tengan un campo 'races'
        const referenceField = 'races';

        await Promise.all(modelsToClean.map(Model => 
            Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
        ));

        await Race.findByIdAndDelete(id);
        res.json({ message: "Race deleted successfully and all references cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting race", error: error.message });
    }
});

module.exports = router;
