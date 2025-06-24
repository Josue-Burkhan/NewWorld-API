// 📁 /models/Ability.js

const mongoose = require("mongoose");

const abilitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    type: String,
    element: String,
    cooldown: String,
    cost: String,
    level: String,
    requirements: String,
    effect: String,
    customNotes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES 
    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCharacters: [String],

    powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    rawPowerSystems: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawEvents: [String],

    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    rawItems: [String],

    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technology" }],
    rawTechnologies: [String],

    creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
    rawCreatures: [String],

    religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
    rawReligions: [String],

    races: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
    rawRaces: [String],

}, { collection: "newworld.ability", timestamps: true });

module.exports = mongoose.model("Ability", abilitySchema);
