const express = require("express");
const router = express.Router();
const Place = require("../models/Place");

// GET
router.get("/", async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving places", error });
  }
});

// GET
router.get("/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: "Place not found" });
    res.json(place);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// POST
router.post("/", async (req, res) => {
  try {
    const newPlace = new Place(req.body);
    await newPlace.save();
    res.status(201).json(newPlace);
  } catch (error) {
    res.status(400).json({ message: "Error creating place", error });
  }
});

// PUT
router.put("/:id", async (req, res) => {
  try {
    const updatedPlace = await Place.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPlace) return res.status(404).json({ message: "Place not found" });
    res.json(updatedPlace);
  } catch (error) {
    res.status(400).json({ message: "Error updating place", error });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deletedPlace = await Place.findByIdAndDelete(req.params.id);
    if (!deletedPlace) return res.status(404).json({ message: "Place not found" });
    res.json({ message: "Place deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting place", error });
  }
});

module.exports = router;
