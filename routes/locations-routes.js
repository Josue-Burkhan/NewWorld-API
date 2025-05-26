const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Place = require("../models/Location");
const User = require("../models/user-model");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");
const autoPopulateReferences = require("../utils/autoPopulateRefs");


// GET all locations for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const locations = await Place.find({ owner: req.user.userId })
      .populate({ path: "characters", select: "name" })
      .populate({ path: "factions", select: "name" })
      .populate({ path: "events", select: "name" })
      .populate({ path: "creatures", select: "name" })
      .populate({ path: "items", select: "name" });

    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving places", error });
  }
});

// GET location by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid location ID" });
    }
    const place = await Place.findOne({ _id: req.params.id, owner: req.user.userId })
      .populate({ path: "characters", select: "name" })
      .populate({ path: "factions", select: "name" })
      .populate({ path: "events", select: "name" })
      .populate({ path: "creatures", select: "name" })
      .populate({ path: "items", select: "name" });

    if (!place) return res.status(404).json({ message: "Place not found" });
    res.json(place);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// POST - Create location
router.post("/", authMiddleware, enforceLimit(Place), async (req, res) => {
  const i = req.body.name || req.body.world;
  try {
    await autoPopulateReferences(req.body, req.user.userId);

    const userId = req.user.userId;
    const newPlace = new Place({ ...req.body, owner: userId });

    await newPlace.save();
    res.status(201).json(newPlace);
  } catch (error) {
    res.status(400).json({ message: "Error creating place", error: error.message });
  }
});

// PUT update location
router.put("/:id", authMiddleware, async (req, res) => {
  const i = req.body.name || req.body.world;
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid location ID" });
    }

    const place = await Place.findById(id);
    if (!place) return res.status(404).json({ message: "Place not found" });

    if (place.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not have permission to update this place" });
    }

    await autoPopulateReferences(req.body, req.user.userId);

    const updatedPlace = await Place.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedPlace);
  } catch (error) {
    res.status(400).json({ message: "Error updating place", error });
  }
});


// DELETE location
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid location ID" });
    }
    const place = await Place.findById(id);
    if (!place) return res.status(404).json({ message: "Place not found" });

    if (place.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not have permission to delete this place" });
    }

    await Place.findByIdAndDelete(id);
    res.json({ message: "Place deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting place", error });
  }
});

module.exports = router;
