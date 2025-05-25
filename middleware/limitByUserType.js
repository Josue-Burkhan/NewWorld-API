const mongoose = require("mongoose");

const limits = {
  free: 50,
  premium: 300,
  creator: Infinity,
};

const getUserType = (user) => {
  if (!user || !user.role) return "free";
  if (user.role === "Creator of Worlds") return "creator";
  if (user.role === "Premium") return "premium";
  return "free";
};

module.exports = (Model) => async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const userType = getUserType(req.user);

    const count = await Model.countDocuments({ owner: userId });
    if (count >= limits[userType]) {
      return res.status(403).json({
        message: `Limit reached for your account type (${userType})`,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Limit check failed", error: error.message });
  }
};