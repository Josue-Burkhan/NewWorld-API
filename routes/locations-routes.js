// 📁 /routes/locations-routes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Location = require("../models/Location");
const authMiddleware = require("../middleware/authMiddleware");
const autoPopulateReferences = require("../utils/autoPopulateRefs");
const enforceLimit = require("../middleware/limitByUserType");

// --- MODELOS PARA LIMPIEZA DE REFERENCIAS ---
const Character = require("../models/Character");
const Faction = require("../models/Faction");
const Item = require("../models/Item");
// ... y otros modelos que tengan un campo 'locations'.

// --- POPULATE HELPER ---
const populationPaths = [
    { path: 'locations', select: 'name' }, // Para sub-localizaciones
    { path: 'factions', select: 'name' },
    { path: 'events', select: 'name' },
    { path: 'characters', select: 'name' },
    { path: 'items', select: 'name' },
    { path: 'creatures', select: 'name' },
    { path: 'stories', select: 'name' },
    { path: 'languages', select: 'name' },
    { path: 'religions', select: 'name' }
];

// --- FUNCIÓN AUXILIAR DE SINCRONIZACIÓN PARA LOCATION ---
async function syncAllReferences(locationId, originalDoc, newDocData) {
    const fieldsToSync = {
        locations: 'Location', factions: 'Faction', events: 'Event',
        characters: 'Character', items: 'Item', creatures: 'Creature',
        stories: 'Story', languages: 'Language', religions: 'Religion'
    };
    const updatePromises = [];
    const inverseFieldName = 'locations'; // El campo en los otros modelos es 'locations'

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
                Model.updateMany({ _id: { $in: toAdd } }, { $addToSet: { [inverseFieldName]: locationId } })
            );
        }
        if (toRemove.length > 0) {
            updatePromises.push(
                Model.updateMany({ _id: { $in: toRemove } }, { $pull: { [inverseFieldName]: locationId } })
            );
        }
    }
    await Promise.all(updatePromises);
}

// --- ROUTES ---

// GET / : Obtiene todas las localizaciones con paginación
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;
        const locations = await Location.find({ owner: req.user.userId })
            .populate(populationPaths).sort(sort).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await Location.countDocuments({ owner: req.user.userId });
        res.json({ locations, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving locations", error: error.message });
    }
});

// GET /:id : Obtiene una sola localización
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, owner: req.user.userId }).populate(populationPaths);
        if (!location) return res.status(404).json({ message: "Location not found" });
        res.json(location);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving location", error: error.message });
    }
});

// POST / : Crea una nueva localización
router.post("/", authMiddleware, enforceLimit(Location), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, world } = req.body;
        if (!world) return res.status(400).json({ message: "World ID is required." });
        const existingLocation = await Location.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world });
        if (existingLocation) return res.status(409).json({ message: `A location named "${name}" already exists in this world.` });

        const { enrichedBody } = await autoPopulateReferences(req.body, userId);
        enrichedBody.owner = userId;

        const newLocation = new Location(enrichedBody);
        await newLocation.save();

        await syncAllReferences(newLocation._id, null, newLocation);

        const populatedLocation = await Location.findById(newLocation._id).populate(populationPaths);
        res.status(201).json(populatedLocation);
    } catch (error) {
        console.error("Error creating location:", error);
        res.status(500).json({ message: "Error creating location", error: error.message });
    }
});

// PUT /:id : Actualiza una localización
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const originalLocation = await Location.findById(id).lean();
        if (!originalLocation || originalLocation.owner.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Location not found or access denied" });
        }

        const { enrichedBody } = await autoPopulateReferences(req.body, req.user.userId);
        await Location.findByIdAndUpdate(id, { $set: enrichedBody });

        await syncAllReferences(id, originalLocation, enrichedBody);

        const updatedLocation = await Location.findById(id).populate(populationPaths);
        res.json(updatedLocation);
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ message: "Error updating location", error: error.message });
    }
});

// DELETE /:id : Borra una localización y limpia todas las referencias
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const locationToDelete = await Location.findOne({ _id: id, owner: req.user.userId });
        if (!locationToDelete) return res.status(404).json({ message: "Location not found or access denied" });

        await syncAllReferences(id, locationToDelete, null);
        await Location.findByIdAndDelete(id);

        res.json({ message: "Location deleted successfully and all references cleaned." });
    } catch (error) {
        console.error("Error deleting location:", error);
        res.status(500).json({ message: "Error deleting location", error: error.message });
    }
});

module.exports = router;
