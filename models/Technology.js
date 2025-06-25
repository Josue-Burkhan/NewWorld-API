// 📁 /models/Technology.js

const mongoose = require("mongoose");

const technologySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    techType: { type: String },
    origin: { type: String },
    yearCreated: Number,
    currentUse: String,
    limitations: String,
    energySource: String,
    notes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES (AHORA TODAS EN PLURAL, COMO ARRAYS Y CON RAW) ---
    creators: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCreators: [String],

    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCharacters: [String],

    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawFactions: [String],

    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    rawItems: [String],

    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawEvents: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawLocations: [String],

    powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    rawPowerSystems: [String],

}, { collection: "newworld.technology", timestamps: true });

module.exports = mongoose.model("Technology", technologySchema);
