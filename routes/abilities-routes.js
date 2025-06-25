// 📁 /routes/abilities-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Ability = require("../models/Ability");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
// Importa todos los modelos que podrían tener un campo 'abilities'
const Character = require("../models/Character");
const Creature = require("../models/Creature");


// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'powerSystems', select: 'name' },
    { path: 'stories', select: 'name' }, { path: 'events', select: 'name' },
    { path: 'items', select: 'name' }, { path: 'technologies', select: 'name' },
    { path: 'creatures', select: 'name' }, { path: 'religions', select: 'name' },
    { path: 'races', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todas las habilidades con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const abilities = await Ability.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Ability.countDocuments({ owner: req.user.userId });
        res.json({
            abilities,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
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
        const ability = await Ability.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);

        if (!ability) return res.status(404).json({ message: "Ability not found or access denied" });
        res.json(ability);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving ability", error: error.message });
    }
});

// POST / : Crea una nueva habilidad (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Ability), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;

        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingAbility = await Ability.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingAbility) return res.status(409).json({ message: `An ability named "${name}" already exists in this world.` });

        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newAbility = new Ability(enrichedBody);
        await newAbility.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { abilities: newAbility._id } });
            }));
        }

        res.status(201).json(newAbility);
    } catch (error) {
        res.status(400).json({ message: "Error creating ability", error: error.message });
    }
});

// PUT /:id : Actualiza una habilidad
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params; // ID de la habilidad que se edita
        const ability = await Ability.findOne({ _id: id, owner: req.user.userId });
        if (!ability) return res.status(404).json({ message: "Ability not found or access denied" });

        // CAMBIO: Capturamos 'newlyCreated'
        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, req.user.userId);

        const updatedAbility = await Ability.findByIdAndUpdate(
            id,
            { $set: enrichedBody },
            { new: true, runValidators: true }
        );

        // AÑADIDO: Lógica de vinculación de vuelta
        if (newlyCreated && newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                // Vincula la nueva entidad con esta habilidad
                return Model.findByIdAndUpdate(item.id, { $push: { abilities: id } });
            }));
        }

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

        // Lógica de limpieza universal
        const modelsToClean = [Character, Creature]; // Añade aquí todos los modelos que usen 'abilities'
        const referenceField = 'abilities'; // El nombre del campo a limpiar

        await Promise.all(modelsToClean.map(Model =>
            Model.updateMany(
                { [referenceField]: id },
                { $pull: { [referenceField]: id } }
            )
        ));

        // Finalmente, borra la habilidad en sí
        await Ability.findByIdAndDelete(id);

        res.json({ message: "Ability deleted successfully and all references have been cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting ability", error: error.message });
    }
});

module.exports = router;
