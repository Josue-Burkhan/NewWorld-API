// 📁 /models/Faction.js

const mongoose = require("mongoose");

const factionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String },
    symbol: { type: String },
    economySystem: { type: String },
    technology: { type: String },
    goals: [String],
    history: { type: String },
    customNotes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES (AHORA TODAS EN PLURAL, COMO ARRAYS Y CON RAW) ---
    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCharacters: [String],

    allies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawAllies: [String],

    enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawEnemies: [String],

    headquarters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawHeadquarters: [String],

    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawEvents: [String],

    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    rawItems: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

    religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
    rawReligions: [String],

    languages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Language" }],
    rawLanguages: [String],

    powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    rawPowerSystems: [String],

    territory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawTerritory: [String],

}, { collection: "newworld.faction", timestamps: true });

module.exports = mongoose.model("Faction", factionSchema);
