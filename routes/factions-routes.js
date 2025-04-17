const express = require("express");
const router = express.Router();
const Faction = require("../models/Faction");

// GET
router.get("/", async (req, res) => {
  try {
    const factions = await Faction.find();
    res.json(factions);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving factions", error });
  }
});

// GET
router.get("/:id", async (req, res) => {
  try {
    const faction = await Faction.findById(req.params.id);
    if (!faction) return res.status(404).json({ message: "Faction not found" });
    res.json(faction);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// POST
router.post("/", async (req, res) => {
  try {
    const newFaction = new Faction(req.body);
    await newFaction.save();
    res.status(201).json(newFaction);
  } catch (error) {
    res.status(400).json({ message: "Error creating faction", error });
  }
});

// PUT
router.put("/:id", async (req, res) => {
  try {
    const updatedFaction = await Faction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedFaction) return res.status(404).json({ message: "Faction not found" });
    res.json(updatedFaction);
  } catch (error) {
    res.status(400).json({ message: "Error updating faction", error });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deletedFaction = await Faction.findByIdAndDelete(req.params.id);
    if (!deletedFaction) return res.status(404).json({ message: "Faction not found" });
    res.json({ message: "Faction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting faction", error });
  }
});

module.exports = router;
