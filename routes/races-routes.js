const express = require("express");
const router = express.Router();
const Race = require("../models/Race");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

router.use(authMiddleware);

router.get("/", async (req, res) => {
    try {
        const races = await Race.find({ owner: req.user.userId })
            .populate({ path: "language", select: "_id name" })
            .populate({ path: "characters", select: "_id name" })
            .populate({ path: "locations", select: "_id name" })
            .populate({ path: "religions", select: "_id name" })
            .populate({ path: "stories", select: "_id title" })
            .populate({ path: "events", select: "_id title" })
            .populate({ path: "powerSystems", select: "_id name" });

        res.json(races);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving races" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const race = await Race.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate({ path: "language", select: "_id name" })
            .populate({ path: "characters", select: "_id name" })
            .populate({ path: "locations", select: "_id name" })
            .populate({ path: "religions", select: "_id name" })
            .populate({ path: "stories", select: "_id title" })
            .populate({ path: "events", select: "_id title" })
            .populate({ path: "powerSystems", select: "_id name" });

        if (!race) {
            return res.status(404).json({ message: "Race not found" });
        }

        res.json(race);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving race" });
    }
});

router.post("/", enforceLimit(Race), async (req, res) => {
    try {
        const i = req.body.name;
        const newRace = new Race({
            ...req.body,
            owner: req.user.userId
        });
        const saved = await newRace.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: "Error creating race" });
    }
});

router.put("/:id", async (req, res) => {
    const i = req.body.name; 
    try {
        const updated = await Race.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            req.body,
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Race not found" });
        }
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: "Error updating race" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Race.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.userId
        });
        if (!deleted) {
            return res.status(404).json({ message: "Race not found" });
        }
        res.json({ message: "Race deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting race" });
    }
});

module.exports = router;
