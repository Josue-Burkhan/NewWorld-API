const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require("../models/Item");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

// GET - Todos los items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find()
      .populate({ path: "createdBy", select: "_id name" })
      .populate({ path: "usedBy", select: "_id name" })
      .populate({ path: "associatedFactions", select: "_id name" })
      .populate({ path: "associatedEvents", select: "_id title" })
      .populate({ path: "associatedStories", select: "_id title" })
      .populate({ path: "foundInLocations", select: "_id name" })
      .populate({ path: "religion", select: "_id name" })
      .populate({ path: "powerSystem", select: "_id name" })
      .populate({ path: "language", select: "_id name" })
      .populate({ path: "abilitiesGranted", select: "_id name" })
      .populate({ path: "currentOwner", select: "_id name" });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving items", error: error.message });
  }
});

// GET - Item por ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findById(req.params.id)
      .populate({ path: "createdBy", select: "_id name" })
      .populate({ path: "usedBy", select: "_id name" })
      .populate({ path: "associatedFactions", select: "_id name" })
      .populate({ path: "associatedEvents", select: "_id title" })
      .populate({ path: "associatedStories", select: "_id title" })
      .populate({ path: "foundInLocations", select: "_id name" })
      .populate({ path: "religion", select: "_id name" })
      .populate({ path: "powerSystem", select: "_id name" })
      .populate({ path: "language", select: "_id name" })
      .populate({ path: "abilitiesGranted", select: "_id name" })
      .populate({ path: "currentOwner", select: "_id name" });

    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST - Crear nuevo item
router.post("/", authMiddleware, enforceLimit(Item), async (req, res) => {
  try {
    const newItem = new Item({
      ...req.body,
      owner: req.user.userId
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: "Error creating item", error: error.message });
  }
});

// PUT - Actualizar item
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedItem) return res.status(404).json({ message: "Item not found" });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: "Error updating item", error: error.message });
  }
});

// DELETE - Eliminar item
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error: error.message });
  }
});

module.exports = router;
