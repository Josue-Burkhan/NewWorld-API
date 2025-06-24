// 📁 /routes/searchRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Ability = require('../models/Ability');
const Character = require('../models/Character');
const Language = require('../models/Language');

// Importa TODOS los modelos que quieres que sean buscables
const models = {
    Ability: require("../models/Ability"),
    Character: require("../models/Character"),
    Event: require("../models/Event"),
    Race: require("../models/Race"),
    Faction: require("../models/Faction"),
    Item: require("../models/Item"),
    Language: require("../models/Language"),
    Technology: require("../models/Technology"),
    Religion: require("../models/Religion"),
    PowerSystem: require("../models/PowerSystem"),
    Creature: require("../models/Creature"),
    Economy: require("../models/Economy"),
    Story: require("../models/Story"),
    Location: require("../models/Location"),
};

router.get('/:category', authMiddleware, async (req, res) => {
    const { category } = req.params;
    const { q, worldId } = req.query;

    const Model = models[category];

    if (!Model) {
        return res.status(404).json({ message: "Categoría no encontrada" });
    }
    if (!q || !worldId) {
        return res.status(400).json({ message: "Faltan parámetros de búsqueda (q, worldId)" });
    }

    try {
        const results = await Model.find({
            world: worldId,
            name: { $regex: q, $options: 'i' }
        }).limit(10).select('name');

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: `Error buscando en la categoría ${category}`, error: error.message });
    }
});

module.exports = router;
