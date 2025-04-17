const express = require("express");
const router = express.Router();
const Species = require("../models/Species");

// GET
router.get("/", async (req, res) => {
  try {
    const species = await Species.find();
    res.json(species);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving species", error });
  }
});

// GET
router.get("/:id", async (req, res) => {
  try {
    const species = await Species.findById(req.params.id);
    if (!species) return res.status(404).json({ message: "Species not found" });
    res.json(species);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// POST
router.post("/", async (req, res) => {
  try {
    const newSpecies = new Species(req.body);
    await newSpecies.save();
    res.status(201).json(newSpecies);
  } catch (error) {
    res.status(400).json({ message: "Error creating species", error });
  }
});

// PUT
router.put("/:id", async (req, res) => {
  try {
    const updatedSpecies = await Species.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSpecies) return res.status(404).json({ message: "Species not found" });
    res.json(updatedSpecies);
  } catch (error) {
    res.status(400).json({ message: "Error updating species", error });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deletedSpecies = await Species.findByIdAndDelete(req.params.id);
    if (!deletedSpecies) return res.status(404).json({ message: "Species not found" });
    res.json({ message: "Species deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting species", error });
  }
});

module.exports = router;
