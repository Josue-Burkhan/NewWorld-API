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
    rawFollowers: [String],

    associatedFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawAssociatedFactions: [String],

    practicedInLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawPracticedInLocations: [String],

    linkedCreatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
    rawLinkedCreatures: [String],

    linkedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawLinkedEvents: [String],

    linkedPowerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    rawLinkedPowerSystems: [String],

    appearsInStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawAppearsInStories: [String],

    notes: { type: String, maxlength: 250 },

    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.religion", timestamps: true });

module.exports = mongoose.model("Religion", religionSchema);
