const express = require("express");
const router = express.Router();
const Language = require("../models/Language");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

// GET - Obtener todos los idiomas del usuario
router.get("/", authMiddleware, async (req, res) => {
    try {
        const languages = await Language.find({ owner: req.user.userId });
        res.json(languages);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving languages", error });
    }
});

// GET - Obtener un idioma por ID
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const language = await Language.findOne({ _id: req.params.id, owner: req.user.userId });
        if (!language) return res.status(404).json({ message: "Language not found" });
        res.json(language);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// POST - Crear nuevo idioma (con límite por tipo de usuario)
router.post("/", authMiddleware, enforceLimit(Language), async (req, res) => {
    try {
        const i = req.body.name || req.body.world;
        const newLanguage = new Language({
            ...req.body,
            owner: req.user.userId
        });

        await newLanguage.save();
        res.status(201).json(newLanguage);
    } catch (error) {
        res.status(400).json({ message: "Error creating language", error: error.message });
    }
});

// PUT - Actualizar idioma existente
router.put("/:id", authMiddleware, async (req, res) => {
    const i = req.body.name; 
    try {
        const updatedLanguage = await Language.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            req.body,
            { new: true }
        );
        if (!updatedLanguage) return res.status(404).json({ message: "Language not found" });
        res.json(updatedLanguage);
    } catch (error) {
        res.status(400).json({ message: "Error updating language", error });
    }
});

// DELETE - Eliminar idioma
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const deletedLanguage = await Language.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
        if (!deletedLanguage) return res.status(404).json({ message: "Language not found" });
        res.json({ message: "Language deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting language", error });
    }
});

module.exports = router;
