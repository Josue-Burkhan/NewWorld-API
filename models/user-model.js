const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    plan: {
        type: String,
        enum: ['Free', 'Premium', 'Creator of Worlds'],
        default: 'Free'
    },

    planType: {
        type: String,
        enum: ['Monthly', 'Yearly'],
        default: 'Monthly'
    },

    planExpiresAt: { type: Date },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
