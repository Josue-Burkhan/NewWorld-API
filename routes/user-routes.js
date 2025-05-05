const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
const router = express.Router();

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

router.get("/me", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.userId).select("email plan");

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    userId: user._id,
    email: user.email,
    plan: user.plan
  });
});

module.exports = router;
