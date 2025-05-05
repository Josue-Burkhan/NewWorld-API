const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    plan: { type: String, enum: ['free', 'premium', 'creator of worlds'], default: 'free' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);