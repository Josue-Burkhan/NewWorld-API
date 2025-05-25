const express = require("express");
const router = express.Router();
const Religion = require("../models/Religion");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const religions = await Religion.find({ owner: req.user.userId })
      .populate({ path: "followers", select: "_id name" })
      .populate({ path: "associatedFactions", select: "_id name" })
      .populate({ path: "practicedInLocations", select: "_id name" })
      .populate({ path: "linkedCreatures", select: "_id name" })
      .populate({ path: "linkedEvents", select: "_id name" })
      .populate({ path: "linkedPowerSystems", select: "_id name" })
      .populate({ path: "appearsInStories", select: "_id name" });
    res.json(religions);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving religions" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const religion = await Religion.findOne({ _id: req.params.id, owner: req.user.userId })
      .populate({ path: "followers", select: "_id name" })
      .populate({ path: "associatedFactions", select: "_id name" })
      .populate({ path: "practicedInLocations", select: "_id name" })
      .populate({ path: "linkedCreatures", select: "_id name" })
      .populate({ path: "linkedEvents", select: "_id name" })
      .populate({ path: "linkedPowerSystems", select: "_id name" })
      .populate({ path: "appearsInStories", select: "_id name" });

    if (!religion) {
      return res.status(404).json({ message: "Religion not found" });
    }

    res.json(religion);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving religion" });
  }
});

router.post("/", enforceLimit(Religion), async (req, res) => {
  try {
    const newReligion = new Religion({
      ...req.body,
      owner: req.user.userId
    });
    const saved = await newReligion.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Error creating religion" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Religion.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Religion not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Error updating religion" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Religion.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId
    });
    if (!deleted) {
      return res.status(404).json({ message: "Religion not found" });
    }
    res.json({ message: "Religion deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting religion" });
  }
});

module.exports = router;
