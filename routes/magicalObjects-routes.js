const express = require("express");
const router = express.Router();
const MagicalObject = require("../models/MagicalObject");

// GET
router.get("/", async (req, res) => {
  try {
    const objects = await MagicalObject.find();
    res.json(objects);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving magical objects", error });
  }
});

// GET
router.get("/:id", async (req, res) => {
  try {
    const object = await MagicalObject.findById(req.params.id);
    if (!object) return res.status(404).json({ message: "Magical object not found" });
    res.json(object);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// POST
router.post("/", async (req, res) => {
  try {
    const newObject = new MagicalObject(req.body);
    await newObject.save();
    res.status(201).json(newObject);
  } catch (error) {
    res.status(400).json({ message: "Error creating magical object", error });
  }
});

// PUT
router.put("/:id", async (req, res) => {
  try {
    const updatedObject = await MagicalObject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedObject) return res.status(404).json({ message: "Magical object not found" });
    res.json(updatedObject);
  } catch (error) {
    res.status(400).json({ message: "Error updating magical object", error });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deletedObject = await MagicalObject.findByIdAndDelete(req.params.id);
    if (!deletedObject) return res.status(404).json({ message: "Magical object not found" });
    res.json({ message: "Magical object deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting magical object", error });
  }
});

module.exports = router;
