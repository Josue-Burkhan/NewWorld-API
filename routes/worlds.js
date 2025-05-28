const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const World = require("../models/World");
const User = require("../models/user-model");
const {
  canCreateWorld
} = require("../services/userServices");
const worldTemplates = require('../utils/worldTemplates');


const jwt = require("jsonwebtoken");
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST /api/worlds → Crear nuevo mundo
router.post("/", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { name, description, template } = req.body;
    const user = await User.findById(req.user.userId);
    const currentWorldCount = await World.countDocuments({ owner: user._id });

    if (!canCreateWorld(user, currentWorldCount)) {
      return res.status(403).json({ error: "You cannot create more worlds with your current plan." });
    }

    const modules = worldTemplates[template] || {};

    const newWorld = new World({
      name,
      description,
      owner: user._id,
      image: req.file ? `/uploads/${req.file.filename}` : undefined,
      modules
    });

    await newWorld.save();
    res.status(201).json(newWorld);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// GET /api/worlds → Obtener todos los mundos del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    const worlds = await World.find({ owner: req.user.userId });
    res.json(worlds);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/worlds/:id → Obtener mundo por ID
router.get("/:id", authenticateToken, async (req, res) => {
  const world = await World.findOne({ _id: req.params.id, owner: req.user.userId });
  if (!world) return res.status(404).json({ error: "World not found" });
  res.json(world);
});

// PUT /api/worlds/:id → Editar mundo
router.put("/:id", authenticateToken, upload.single("image"), async (req, res) => {
  const world = await World.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.userId },
    {
      name: req.body.name,
      description: req.body.description,
      ...(req.file && { image: `/uploads/${req.file.filename}` })
    },
    { new: true }
  );
  if (!world) return res.status(404).json({ error: "World not found or not owned" });
  res.json(world);
});

// DELETE /api/worlds/:id → Eliminar mundo
router.delete("/:id", authenticateToken, async (req, res) => {
  const world = await World.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
  if (!world) return res.status(404).json({ error: "World not found or not owned" });
  res.json({ message: "World deleted" });
});

module.exports = router;
