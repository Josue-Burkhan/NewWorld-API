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
// ... y otros modelos que tengan un campo 'events'.

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'characters', select: 'name' }, { path: 'factions', select: 'name' },
    { path: 'locations', select: 'name' }, { path: 'items', select: 'name' },
    { path: 'abilities', select: 'name' }, { path: 'stories', select: 'name' },
    { path: 'powerSystems', select: 'name' }, { path: 'creatures', select: 'name' },
    { path: 'religions', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA EVENT ---
async function syncAllReferences(eventId, originalDoc, newDocData) {
    const fieldsToSync = {
        characters: 'Character', factions: 'Faction', locations: 'Location',
        items: 'Item', abilities: 'Ability', stories: 'Story',
        powerSystems: 'PowerSystem', creatures: 'Creature', religions: 'Religion'
    };
    const updatePromises = [];
    const inverseFieldName = 'events'; // El campo en los otros modelos es 'events'

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
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: eventId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: eventId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todos los eventos con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const events = await Event.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Event.countDocuments({ owner: req.user.userId });
        res.json({ events, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving events", error: error.message });
    }
});

// GET /:id : Obtiene un solo evento
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving event", error: error.message });
    }
});

// POST / : Crea un nuevo evento
router.post("/", authMiddleware, enforceLimit(Event), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingEvent = await Event.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingEvent) return res.status(409).json({ message: `An event named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newEvent = new Event(enrichedBody);
        await newEvent.save();

        await syncAllReferences(newEvent._id, null, newEvent);

        const populatedEvent = await Event.findById(newEvent._id).populate(populationPaths);
        res.status(201).json(populatedEvent);
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Error creating event", error: error.message });
    }
});

// PUT /:id : Actualiza un evento
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalEvent = await Event.findById(id).lean();
        if (!originalEvent || originalEvent.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Event not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Event.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalEvent, enrichedBody);

        const updatedEvent = await Event.findById(id).populate(populationPaths);
        res.json(updatedEvent);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Error updating event", error: error.message });
    }
});

// DELETE /:id : Borra un evento y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const eventToDelete = await Event.findOne({ _id: id, owner: req.user.userId });
        if (!eventToDelete) return res.status(404).json({ message: "Event not found or access denied" });

        await syncAllReferences(id, eventToDelete, null);
        await Event.findByIdAndDelete(id);

        res.json({ message: "Event deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Error deleting event", error: error.message });
    }
});

module.exports = router;
