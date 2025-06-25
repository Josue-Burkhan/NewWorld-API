// 📁 /models/PowerSystem.js

const mongoose = require("mongoose");

const powerSystemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    sourceOfPower: { type: String },
    rules: { type: String },
    limitations: { type: String },
    classificationTypes: [String],
    symbolsOrMarks: { type: String },
    customNotes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES (AHORA TODAS EN PLURAL, COMO ARRAYS Y CON RAW) ---
    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCharacters: [String],

    abilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
    rawAbilities: [String],

    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawFactions: [String],

    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawEvents: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

    creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
    rawCreatures: [String],

    religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
    rawReligions: [String],

}, { collection: "newworld.powersystem", timestamps: true });

module.exports = mongoose.model("PowerSystem", powerSystemSchema);
