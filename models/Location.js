// 📁 /models/Location.js

const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    climate: { type: String },
    terrain: { type: String },
    population: { type: Number },
    technologyLevel: { type: String },
    economy: { type: String },
    customNotes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES (CORREGIDO Y ESTANDARIZADO) ---
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawLocations: [String],
    
    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawFactions: [String],

    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawEvents: [String],

    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCharacters: [String],

    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    rawItems: [String],

    creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
    rawCreatures: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

    languages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Language" }],
    rawLanguages: [String],

    religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
    rawReligions: [String],

}, { collection: "newworld.location", timestamps: true });

module.exports = mongoose.model("Location", locationSchema);
