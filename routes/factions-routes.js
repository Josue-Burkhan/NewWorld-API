const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Faction = require("../models/Faction");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");
const autoPopulateReferences = require("../utils/autoPopulateRefs");


// GET all factions for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const factions = await Faction.find({ owner: req.user.userId })
      .populate("members", "_id name")
      .populate("allies", "_id name")
      .populate("enemies", "_id name")
      .populate("headquarters", "_id name")
      .populate("involvedInEvents", "_id title")
      .populate("associatedItems", "_id name")
      .populate("associatedStories", "_id title")
      .populate("religion", "_id name")
      .populate("language", "_id name")
      .populate("powerSystem", "_id name")
      .populate("territory", "_id name");

    res.json(factions);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving factions", error: error.message });
  }
});

// GET a single faction by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid faction ID" });
    }

    const faction = await Faction.findOne({ _id: id, owner: req.user.userId })
      .populate("members", "_id name")
      .populate("allies", "_id name")
      .populate("enemies", "_id name")
      .populate("headquarters", "_id name")
      .populate("involvedInEvents", "_id title")
      .populate("associatedItems", "_id name")
      .populate("associatedStories", "_id title")
      .populate("religion", "_id name")
      .populate("language", "_id name")
      .populate("powerSystem", "_id name")
      .populate("territory", "_id name");

    if (!faction) return res.status(404).json({ message: "Faction not found" });
    res.json(faction);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving faction", error: error.message });
  }
});

// POST - Create faction
router.post("/", authMiddleware, enforceLimit(Faction), async (req, res) => {
    const i = req.body.name || req.body.world;
  try {
    await autoPopulateReferences(req.body, req.user.userId);

    const newFaction = new Faction({
      ...req.body,
      owner: req.user.userId
    });

    await newFaction.save();
    res.status(201).json(newFaction);
  } catch (error) {
    res.status(400).json({ message: "Error creating faction", error: error.message });
  }
});

// PUT - Update faction
router.put("/:id", authMiddleware, async (req, res) => {
    const i = req.body.name || req.body.world;
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid faction ID" });
    }

    const faction = await Faction.findById(id);
    if (!faction) {
      return res.status(404).json({ message: "Faction not found" });
    }

    if (faction.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not own this faction" });
    }

    await autoPopulateReferences(req.body, req.user.userId);

    const updatedFaction = await Faction.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    res.json(updatedFaction);
  } catch (error) {
    res.status(400).json({ message: "Error updating faction", error: error.message });
  }
});

// DELETE - Remove faction
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid faction ID" });
    }

    const faction = await Faction.findById(id);
    if (!faction) {
      return res.status(404).json({ message: "Faction not found" });
    }

    if (faction.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not own this faction" });
    }

    await Faction.findByIdAndDelete(id);
    res.json({ message: "Faction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting faction", error: error.message });
  }
});

module.exports = router;
