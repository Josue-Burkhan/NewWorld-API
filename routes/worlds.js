const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const World = require("../models/World");

// Autenticación (puedes mover esta función a un archivo aparte si se usa en más lugares)
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

// Configura multer para guardar imágenes en /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ej: 1659876543210.png
  }
});

const upload = multer({ storage });

// POST /api/worlds → Crear nuevo mundo
router.post("/", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;

    const newWorld = new World({
      name,
      description,
      owner: req.user.userId,
      image: req.file ? `/uploads/${req.file.filename}` : undefined
    });

    await newWorld.save();
    res.status(201).json(newWorld);
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
