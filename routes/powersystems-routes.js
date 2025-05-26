const express = require("express");
const router = express.Router();
const PowerSystem = require("../models/PowerSystem");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");
const autoPopulateReferences = require("../utils/autoPopulateRefs");


router.use(authMiddleware);

router.get("/", async (req, res) => {
    try {
        const powerSystems = await PowerSystem.find({ owner: req.user.userId })
            .populate({ path: "usedByCharacters", select: "_id name" })
            .populate({ path: "relatedAbilities", select: "_id name" })
            .populate({ path: "usedInFactions", select: "_id name" })
            .populate({ path: "associatedEvents", select: "_id name" })
            .populate({ path: "appearsInStories", select: "_id name" })
            .populate({ path: "linkedCreatures", select: "_id name" })
            .populate({ path: "linkedReligion", select: "_id name" });
        res.json(powerSystems);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving power systems" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const powerSystem = await PowerSystem.findOne({ _id: req.params.id, owner: req.user.userId })
            .populate({ path: "usedByCharacters", select: "_id name" })
            .populate({ path: "relatedAbilities", select: "_id name" })
            .populate({ path: "usedInFactions", select: "_id name" })
            .populate({ path: "associatedEvents", select: "_id name" })
            .populate({ path: "appearsInStories", select: "_id name" })
            .populate({ path: "linkedCreatures", select: "_id name" })
            .populate({ path: "linkedReligion", select: "_id name" });

        if (!powerSystem) {
            return res.status(404).json({ message: "Power system not found" });
        }

        res.json(powerSystem);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving power system" });
    }
});
router.post("/", enforceLimit(PowerSystem), async (req, res) => {
    const i = req.body.name || req.body.world;
    try {
        await autoPopulateReferences(req.body, req.user.userId);

        const newPowerSystem = new PowerSystem({
            ...req.body,
            owner: req.user.userId
        });

        const saved = await newPowerSystem.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: "Error creating power system" });
    }
});

router.put("/:id", async (req, res) => {
    const i = req.body.name || req.body.world;
    try {
        await autoPopulateReferences(req.body, req.user.userId);

        const updated = await PowerSystem.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Power system not found" });
        }

        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: "Error updating power system" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deleted = await PowerSystem.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.userId
        });
        if (!deleted) {
            return res.status(404).json({ message: "Power system not found" });
        }
        res.json({ message: "Power system deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting power system" });
    }
});

module.exports = router;
