const express = require("express");
const router = express.Router();
const Story = require("../models/Story");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

router.use(authMiddleware);

router.get("/", async (req, res) => {
    try {
        const stories = await Story.find({ owner: req.user.userId })
            .populate({ path: "characters", select: "_id name" })
            .populate({ path: "locations", select: "_id name" })
            .populate({ path: "items", select: "_id name" })
            .populate({ path: "events", select: "_id name" })
            .populate({ path: "factions", select: "_id name" })
            .populate({ path: "abilities", select: "_id name" })
            .populate({ path: "powerSystems", select: "_id name" })
            .populate({ path: "creatures", select: "_id name" })
            .populate({ path: "religions", select: "_id name" })
            .populate({ path: "technologies", select: "_id name" })
            .populate({ path: "races", select: "_id name" })
            .populate({ path: "economies", select: "_id name" });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving stories" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const story = await Story.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate({ path: "characters", select: "_id name" })
            .populate({ path: "locations", select: "_id name" })
            .populate({ path: "items", select: "_id name" })
            .populate({ path: "events", select: "_id name" })
            .populate({ path: "factions", select: "_id name" })
            .populate({ path: "abilities", select: "_id name" })
            .populate({ path: "powerSystems", select: "_id name" })
            .populate({ path: "creatures", select: "_id name" })
            .populate({ path: "religions", select: "_id name" })
            .populate({ path: "technologies", select: "_id name" })
            .populate({ path: "races", select: "_id name" })
            .populate({ path: "economies", select: "_id name" });

        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        res.json(story);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving story" });
    }
});

router.post("/", enforceLimit(Story), async (req, res) => {
    try {
        const i = req.body.title;
        const newStory = new Story({
            ...req.body,
            owner: req.user.userId
        });
        const saved = await newStory.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: "Error creating story" });
    }
});

router.put("/:id", async (req, res) => {
    const i = req.body.title; 
    try {
        const updated = await Story.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            req.body,
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Story not found" });
        }
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: "Error updating story" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Story.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.userId
        });
        if (!deleted) {
            return res.status(404).json({ message: "Story not found" });
        }
        res.json({ message: "Story deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting story" });
    }
});

module.exports = router;
