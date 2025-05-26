const express = require("express");
const router = express.Router();
const Creature = require("../models/Creature");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");
const autoPopulateReferences = require("../utils/autoPopulateRefs");


router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const creatures = await Creature.find({ owner: req.user.userId })
      .populate({ path: "encounteredBy", select: "_id name" })
      .populate({ path: "associatedFactions", select: "_id name" })
      .populate({ path: "linkedEvents", select: "_id name" })
      .populate({ path: "appearsInStories", select: "_id name" })
      .populate({ path: "originLocation", select: "_id name" })
      .populate({ path: "relatedPowerSystem", select: "_id name" })
      .populate({ path: "associatedReligion", select: "_id name" });
    res.json(creatures);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving creatures" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const creature = await Creature.findOne({ _id: req.params.id, owner: req.user.userId })
      .populate({ path: "encounteredBy", select: "_id name" })
      .populate({ path: "associatedFactions", select: "_id name" })
      .populate({ path: "linkedEvents", select: "_id name" })
      .populate({ path: "appearsInStories", select: "_id name" })
      .populate({ path: "originLocation", select: "_id name" })
      .populate({ path: "relatedPowerSystem", select: "_id name" })
      .populate({ path: "associatedReligion", select: "_id name" });

    if (!creature) {
      return res.status(404).json({ message: "Creature not found" });
    }

    res.json(creature);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving creature" });
  }
});

// POST - Crear nueva criatura
router.post("/", authMiddleware, enforceLimit(Creature), async (req, res) => {
    const i = req.body.name || req.body.world;
  try {
    const populatedData = await autoPopulateReferences(req.body, req.user.userId);
    const newCreature = new Creature({
      ...populatedData,
      owner: req.user.userId
    });
    const saved = await newCreature.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Error creating creature", error: err.message });
  }
});

// PUT - Actualizar criatura
router.put("/:id", authMiddleware, async (req, res) => {
    const i = req.body.name || req.body.world;
  try {
    const populatedData = await autoPopulateReferences(req.body, req.user.userId);

    const updated = await Creature.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      populatedData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Creature not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Error updating creature", error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Creature.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId
    });
    if (!deleted) {
      return res.status(404).json({ message: "Creature not found" });
    }
    res.json({ message: "Creature deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting creature" });
  }
});

module.exports = router;
