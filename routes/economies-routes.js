const express = require("express");
const router = express.Router();
const Economy = require("../models/Economy");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

router.use(authMiddleware);

router.get("/", async (req, res) => {
    try {
        const economies = await Economy.find({ owner: req.user.userId })
            .populate({ path: "characters", select: "_id name" })
            .populate({ path: "factions", select: "_id name" })
            .populate({ path: "locations", select: "_id name" })
            .populate({ path: "items", select: "_id name" })
            .populate({ path: "races", select: "_id name" })
            .populate({ path: "stories", select: "_id title" });

        res.json(economies);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving economies" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const economy = await Economy.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate({ path: "characters", select: "_id name" })
            .populate({ path: "factions", select: "_id name" })
            .populate({ path: "locations", select: "_id name" })
            .populate({ path: "items", select: "_id name" })
            .populate({ path: "races", select: "_id name" })
            .populate({ path: "stories", select: "_id title" });

        if (!economy) {
            return res.status(404).json({ message: "Economy not found" });
        }

        res.json(economy);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving economy" });
    }
});

router.post("/", enforceLimit(Economy), async (req, res) => {
    try {
        const i = req.body.name;
        const newEconomy = new Economy({
            ...req.body,
            owner: req.user.userId
        });
        const saved = await newEconomy.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: "Error creating economy" });
    }
});

router.put("/:id", async (req, res) => {
    const i = req.body.name; 
    try {
        const updated = await Economy.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            req.body,
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Economy not found" });
        }
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: "Error updating economy" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Economy.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.userId
        });
        if (!deleted) {
            return res.status(404).json({ message: "Economy not found" });
        }
        res.json({ message: "Economy deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting economy" });
    }
});

module.exports = router;
