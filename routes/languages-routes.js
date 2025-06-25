// 📁 /routes/languages-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Language = require("../models/Language");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
const Faction = require("../models/Faction");
const Race = require("../models/Race");
// Añade aquí cualquier otro modelo que tenga un campo 'languages'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'races', select: 'name' },
    { path: 'factions', select: 'name' },
    { path: 'characters', select: 'name' },
    { path: 'locations', select: 'name' },
    { path: 'stories', select: 'name' },
    { path: 'religions', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todos los idiomas con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const languages = await Language.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Language.countDocuments({ owner: req.user.userId });
        res.json({
            languages,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving languages", error: error.message });
    }
});

// GET /:id : Obtiene un solo idioma
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const language = await Language.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!language) return res.status(404).json({ message: "Language not found" });
        res.json(language);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving language", error: error.message });
    }
});

// POST / : Crea un nuevo idioma (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Language), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;

        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingLanguage = await Language.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingLanguage) return res.status(409).json({ message: `A language named "${name}" already exists in this world.` });

        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newLanguage = new Language(enrichedBody);
        await newLanguage.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { languages: newLanguage._id } });
            }));
        }

        res.status(201).json(newLanguage);
    } catch (error) {
        res.status(400).json({ message: "Error creating language", error: error.message });
    }
});

// PUT /:id : Actualiza un idioma
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params; // ID del idioma que se edita
        const language = await Language.findOne({ _id: id, owner: req.user.userId });
        if (!language) return res.status(404).json({ message: "Language not found or access denied" });

        // CAMBIO: Capturamos 'newlyCreated'
        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, req.user.userId);

        const updatedLanguage = await Language.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });

        // AÑADIDO: Lógica de vinculación de vuelta
        if (newlyCreated && newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                // Vincula la nueva entidad con este idioma
                return Model.findByIdAndUpdate(item.id, { $push: { languages: id } });
            }));
        }

        res.json(updatedLanguage);
    } catch (error) {
        console.error("Error updating language:", error);
        res.status(500).json({ message: "Error updating language", error: error.message });
    }
});

// DELETE /:id : Borra un idioma y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const languageToDelete = await Language.findOne({ _id: id, owner: req.user.userId });
        if (!languageToDelete) return res.status(404).json({ message: "Language not found" });

        const modelsToClean = [Character, Faction, Race]; // Añade aquí otros modelos que tengan un campo 'languages'
        const referenceField = 'languages';

        await Promise.all(modelsToClean.map(Model =>
            Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
        ));

        await Language.findByIdAndDelete(id);
        res.json({ message: "Language deleted successfully and all references cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting language", error: error.message });
    }
});

module.exports = router;
