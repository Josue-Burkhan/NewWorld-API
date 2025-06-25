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
// ... y otros modelos que tengan un campo 'languages'.

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'races', select: 'name' },
    { path: 'factions', select: 'name' },
    { path: 'characters', select: 'name' },
    { path: 'locations', select: 'name' },
    { path: 'stories', select: 'name' },
    { path: 'religions', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA LANGUAGE ---
async function syncAllReferences(languageId, originalDoc, newDocData) {
    const fieldsToSync = {
        races: 'Race', factions: 'Faction', characters: 'Character',
        locations: 'Location', stories: 'Story', religions: 'Religion'
    };
    const updatePromises = [];
    const inverseFieldName = 'languages'; // El campo en los otros modelos es 'languages'

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
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: languageId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: languageId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todos los idiomas con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const languages = await Language.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Language.countDocuments({ owner: req.user.userId });
        res.json({ languages, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving languages", error: error.message });
    }
});

// GET /:id : Obtiene un solo idioma
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const language = await Language.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!language) return res.status(404).json({ message: "Language not found" });
        res.json(language);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving language", error: error.message });
    }
});

// POST / : Crea un nuevo idioma
router.post("/", authMiddleware, enforceLimit(Language), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingLanguage = await Language.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingLanguage) return res.status(409).json({ message: `A language named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newLanguage = new Language(enrichedBody);
        await newLanguage.save();

        await syncAllReferences(newLanguage._id, null, newLanguage);

        const populatedLanguage = await Language.findById(newLanguage._id).populate(populationPaths);
        res.status(201).json(populatedLanguage);
    } catch (error) {
        console.error("Error creating language:", error);
        res.status(500).json({ message: "Error creating language", error: error.message });
    }
});

// PUT /:id : Actualiza un idioma
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalLanguage = await Language.findById(id).lean();
        if (!originalLanguage || originalLanguage.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Language not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Language.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalLanguage, enrichedBody);

        const updatedLanguage = await Language.findById(id).populate(populationPaths);
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
        if (!languageToDelete) return res.status(404).json({ message: "Language not found or access denied" });
        
        await syncAllReferences(id, languageToDelete, null);
        await Language.findByIdAndDelete(id);

        res.json({ message: "Language deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting language:", error);
        res.status(500).json({ message: "Error deleting language", error: error.message });
    }
});

module.exports = router;
