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

    // Relaciones
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    associatedFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    practicedInLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    linkedCreatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
    linkedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    linkedPowerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    appearsInStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],

    notes: { type: String, maxlength: 250 },

    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.religion", timestamps: true });

module.exports = mongoose.model("Religion", religionSchema);
