// 📁 /routes/events-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
const Creature = require("../models/Creature");
// Añade aquí cualquier otro modelo que tenga un campo 'events'

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'factions', select: 'name' },
    { path: 'locations', select: 'name' },  { path: 'items', select: 'name' },
    { path: 'abilities', select: 'name' },  { path: 'stories', select: 'name' },
    { path: 'powerSystems', select: 'name' }, { path: 'creatures', select: 'name' },
    { path: 'religions', select: 'name' }
];

// --- ROUTES ---

// GET / : Obtiene todos los eventos con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const events = await Event.find({ owner: req.user.userId })
            .populate(populationPaths)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        
        const count = await Event.countDocuments({ owner: req.user.userId });
        res.json({
            events,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving events", error: error.message });
    }
});

// GET /:id : Obtiene un solo evento
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate(populationPaths);
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving event", error: error.message });
    }
});

// POST / : Crea un nuevo evento (con vinculación de vuelta)
router.post("/", authMiddleware, enforceLimit(Event), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        
        if (!world) return res.status(400).json({ message: "World ID is required." });

        const existingEvent = await Event.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingEvent) return res.status(409).json({ message: `An event named "${name}" already exists in this world.` });
        
        const { enrichedBody, newlyCreated } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newEvent = new Event(enrichedBody);
        await newEvent.save();

        if (newlyCreated.length > 0) {
            await Promise.all(newlyCreated.map(item => {
                const Model = mongoose.model(item.model);
                return Model.findByIdAndUpdate(item.id, { $push: { events: newEvent._id } });
            }));
        }
        
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: "Error creating event", error: error.message });
    }
});

// PUT /:id : Actualiza un evento
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findOne({ _id: id, owner: req.user.userId });
        if (!event) return res.status(404).json({ message: "Event not found or access denied" });

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        
        const updatedEvent = await Event.findByIdAndUpdate(id, { $set: enrichedBody }, { new: true, runValidators: true });
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: "Error updating event", error: error.message });
    }
});

// DELETE /:id : Borra un evento y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const eventToDelete = await Event.findOne({ _id: id, owner: req.user.userId });
        if (!eventToDelete) return res.status(404).json({ message: "Event not found" });

        const modelsToClean = [Character, Creature]; // Añade aquí otros modelos que tengan un campo 'events'
        const referenceField = 'events';

        await Promise.all(modelsToClean.map(Model => 
            Model.updateMany({ [referenceField]: id }, { $pull: { [referenceField]: id } })
        ));

        await Event.findByIdAndDelete(id);
        res.json({ message: "Event deleted successfully and all references cleaned." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error: error.message });
    }
});

module.exports = router;
