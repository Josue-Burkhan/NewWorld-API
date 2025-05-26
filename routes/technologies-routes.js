const express = require("express");
const router = express.Router();
const Technology = require("../models/Technology");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

router.use(authMiddleware);

router.get("/", async (req, res) => {
    try {
        const technologies = await Technology.find({ owner: req.user.userId })
            .populate({ path: "createdBy", select: "_id name" })
            .populate({ path: "usedByCharacters", select: "_id name" })
            .populate({ path: "usedByFactions", select: "_id name" })
            .populate({ path: "linkedItems", select: "_id name" })
            .populate({ path: "linkedEvents", select: "_id name" })
            .populate({ path: "appearsInStories", select: "_id name" })
            .populate({ path: "createdInLocation", select: "_id name" })
            .populate({ path: "relatedPowerSystem", select: "_id name" });
        res.json(technologies);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving technologies" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const technology = await Technology.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate({ path: "createdBy", select: "_id name" })
            .populate({ path: "usedByCharacters", select: "_id name" })
            .populate({ path: "usedByFactions", select: "_id name" })
            .populate({ path: "linkedItems", select: "_id name" })
            .populate({ path: "linkedEvents", select: "_id name" })
            .populate({ path: "appearsInStories", select: "_id name" })
            .populate({ path: "createdInLocation", select: "_id name" })
            .populate({ path: "relatedPowerSystem", select: "_id name" });

        if (!technology) {
            return res.status(404).json({ message: "Technology not found" });
        }

        res.json(technology);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving technology" });
    }
});

router.post("/", enforceLimit(Technology), async (req, res) => {
    try {
        const i = req.body.name || req.body.world;
        const newTechnology = new Technology({
            ...req.body,
            owner: req.user.userId
        });
        const saved = await newTechnology.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: "Error creating technology" });
    }
});

router.put("/:id", async (req, res) => {
    const i = req.body.name; 
    try {
        const updated = await Technology.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            req.body,
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Technology not found" });
        }
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: "Error updating technology" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Technology.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.userId
        });
        if (!deleted) {
            return res.status(404).json({ message: "Technology not found" });
        }
        res.json({ message: "Technology deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting technology" });
    }
});

module.exports = router;
