const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");
const enforceLimit = require("../middleware/limitByUserType");

// GET - Obtener todos los eventos del usuario
router.get("/", authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user.userId });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving events", error });
  }
});

// GET - Obtener un evento por ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.user.userId });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// POST - Crear nuevo evento (con límite por tipo de usuario)
router.post("/", authMiddleware, enforceLimit(Event), async (req, res) => {
  try {
    const newEvent = new Event({
      ...req.body,
      owner: req.user.userId
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: "Error creating event", error: error.message });
  }
});

// PUT - Actualizar evento existente
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: "Error updating event", error });
  }
});

// DELETE - Eliminar evento
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedEvent = await Event.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting event", error });
  }
});

module.exports = router;
