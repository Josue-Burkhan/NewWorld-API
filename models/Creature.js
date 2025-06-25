// 📁 /models/Creature.js

const mongoose = require("mongoose");

const creatureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    speciesType: { type: String },
    description: { type: String },
    habitat: { type: String },
    behavior: { type: String },
    weaknesses: [String],
    domesticated: { type: Boolean, default: false },
    customNotes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES
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

    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawLocations: [String],

    powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    rawPowerSystems: [String],

    religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
    rawReligions: [String],

}, {
    collection: "newworld.creature",
    timestamps: true
});

module.exports = mongoose.model("Creature", creatureSchema);
