// 📁 /models/Religion.js

const mongoose = require("mongoose");

const religionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    deityNames: [String],
    originStory: String,
    practices: [String],
    taboos: [String],
    sacredTexts: [String],
    festivals: [String],
    symbols: [String],
    notes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES (AHORA TODAS EN PLURAL, COMO ARRAYS Y CON RAW) ---
    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCharacters: [String],

    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawFactions: [String],

    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawLocations: [String],

    creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
    rawCreatures: [String],

    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawEvents: [String],

    powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    rawPowerSystems: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

}, { collection: "newworld.religion", timestamps: true });

module.exports = mongoose.model("Religion", religionSchema);
