const express = require("express");
const router = express.Router();
const Ability = require("../models/Ability");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

// GET - Todas las habilidades del usuario
router.get("/", authMiddleware, async (req, res) => {
  try {
    const abilities = await Ability.find({ owner: req.user.userId })
      .populate({ path: "characters", select: "_id name" })
      .populate({ path: "powerSystem", select: "_id name" })
      .populate({ path: "story", select: "_id name" })
      .populate({ path: "events", select: "_id name" })
      .populate({ path: "items", select: "_id name" })
      .populate({ path: "technology", select: "_id name" })
      .populate({ path: "creatures", select: "_id name" })
      .populate({ path: "religion", select: "_id name" })
      .populate({ path: "race", select: "_id name" });
    res.json(abilities);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving abilities", error });
  }
});

// GET - Una habilidad específica
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const ability = await Ability.findOne({ _id: req.params.id, owner: req.user.userId })
      .populate({ path: "characters", select: "_id name" })
      .populate({ path: "powerSystem", select: "_id name" })
      .populate({ path: "story", select: "_id name" })
      .populate({ path: "events", select: "_id name" })
      .populate({ path: "items", select: "_id name" })
      .populate({ path: "technology", select: "_id name" })
      .populate({ path: "creatures", select: "_id name" })
      .populate({ path: "religion", select: "_id name" })
      .populate({ path: "race", select: "_id name" });

    if (!ability) return res.status(404).json({ message: "Ability not found" });
    res.json(ability);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// POST - Crear nueva habilidad
router.post("/", authMiddleware, enforceLimit(Ability), async (req, res) => {
  const { name, description, type } = req.body;

  try {
    const newAbility = new Ability({
      name,
      description,
      type,
      owner: req.user.userId
    });

    await newAbility.save();
    res.status(201).json(newAbility);
  } catch (error) {
    res.status(400).json({ message: "Error creating ability", error: error.message });
  }
});


// PUT - Actualizar habilidad
router.put("/:id", authMiddleware, async (req, res) => {
  const i = req.body.name; 
  try {
    const updatedAbility = await Ability.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updatedAbility) return res.status(404).json({ message: "Ability not found" });
    res.json(updatedAbility);
  } catch (error) {
    res.status(400).json({ message: "Error updating ability", error });
  }
});

// DELETE - Eliminar habilidad
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedAbility = await Ability.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    if (!deletedAbility) return res.status(404).json({ message: "Ability not found" });
    res.json({ message: "Ability deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ability", error });
  }
});

module.exports = router;
