const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Character = require("../models/Character");
const User = require("../models/user-model");
const authMiddleware = require("../middleware/authMiddleware");

// Utility function to check user character limits
async function canCreateCharacter(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const characterCount = await Character.countDocuments({ owner: userId });

  switch (user.accountType) {
    case "Free":
      return characterCount < 80;
    case "Premium":
      return characterCount < 505;
    case "Creator of Worlds":
      return true;
    default:
      return false;
  }
}

// GET all characters for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const characters = await Character.find({ owner: req.user.userId })
      .populate({ path: "abilities",        select: "_id name" })
      .populate({ path: "weapons",          select: "_id name" })
      .populate({ path: "faction",          select: "_id name" })
      .populate({ path: "location",         select: "_id name" })
      .populate({ path: "powerSystem",      select: "_id name" })
      .populate({ path: "religion",         select: "_id name" })
      .populate({ path: "creature",         select: "_id name" })
      .populate({ path: "economy",          select: "_id name" })
      .populate({ path: "story",            select: "_id title" })
      .populate({ path: "race",             select: "_id name" })
      .populate({ path: "relationships.family",  select: "_id name" })
      .populate({ path: "relationships.friends", select: "_id name" })
      .populate({ path: "relationships.enemies", select: "_id name" })
      .populate({ path: "relationships.romance", select: "_id name" });

    res.json(characters);
  } catch (error) {
    console.error("Error retrieving characters:", error);
    if (!req.user || !req.user.userId) {
      return res.status(400).json({ message: "Bad Request - Missing user ID" });
    }
    res.status(500).json({ message: "Error retrieving characters", error: error.message });
  }
});

// GET a single character by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid character ID" });
    }

    const character = await Character.findOne({ _id: req.params.id })
      .populate({ path: "abilities",        select: "_id name" })
      .populate({ path: "weapons",          select: "_id name" })
      .populate({ path: "faction",          select: "_id name" })
      .populate({ path: "location",         select: "_id name" })
      .populate({ path: "powerSystem",      select: "_id name" })
      .populate({ path: "religion",         select: "_id name" })
      .populate({ path: "creature",         select: "_id name" })
      .populate({ path: "economy",          select: "_id name" })
      .populate({ path: "story",            select: "_id title" })
      .populate({ path: "race",             select: "_id name" })
      .populate({ path: "relationships.family",  select: "_id name" })
      .populate({ path: "relationships.friends", select: "_id name" })
      .populate({ path: "relationships.enemies", select: "_id name" })
      .populate({ path: "relationships.romance", select: "_id name" });

    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    res.json(character);
  } catch (error) {
    console.error("Error retrieving character:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const allowed = await canCreateCharacter(userId);
    if (!allowed) {
      return res.status(403).json({ message: "Character creation limit reached for your account type" });
    }
    const {name, world} = req.body;

    const formattedCharacter = {
      ...req.body,
      name,
      age: Number(req.body.age) || 0,
      appearance: {
        ...req.body.appearance,
        height: Number(req.body.appearance?.height) || 0,
        weight: Number(req.body.appearance?.weight) || 0,
        eyeColor: req.body.appearance?.eyeColor || "",
        hairColor: req.body.appearance?.hairColor || "",
        clothingStyle: req.body.appearance?.clothingStyle || "",
      },
      history: {
        ...req.body.history,
        birthplace: req.body.history?.birthplace || "",
        events: (req.body.history?.events || []).map((event) => ({
          ...event,
          year: Number(event.year) || 0,
          description: event.description || "",
        })),
      },
      world,
      owner: userId,
    };

    const newCharacter = new Character(formattedCharacter);
    await newCharacter.save();
    res.status(201).json(newCharacter);
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", error: error.message });
    } else {
      res.status(500).json({ message: "Error creating character", error: error.message });
    }
  }
});

// PUT - Update a character by ID
router.put("/:id", authMiddleware, async (req, res) => {
  const i = req.body.name; 
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid character ID" });
    }

    const character = await Character.findById(id);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (character.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not have permission to update this character" });
    }

    const updatedCharacter = await Character.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedCharacter);
  } catch (error) {
    res.status(400).json({ message: "Error updating character", error: error.message });
  }
});

// DELETE
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid character ID" });
    }

    const character = await Character.findById(id);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (character.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not have permission to delete this character" });
    }

    await Character.findByIdAndDelete(id);
    res.json({ message: "Character deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting character", error: error.message });
  }
});

module.exports = router;
