const mongoose = require("mongoose");

const technologySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,

    techType: { type: String },
    origin: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
    rawCreatedBy: String,

    yearCreated: Number,
    currentUse: String,
    limitations: String,
    energySource: String,

    usedByCharacters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawUsedByCharacters: [String],

    usedByFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawUsedByFactions: [String],

    linkedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    rawLinkedItems: [String],

    linkedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawLinkedEvents: [String],

    appearsInStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawAppearsInStories: [String],

    createdInLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    rawCreatedInLocation: String,

    relatedPowerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
    rawRelatedPowerSystem: String,

    notes: { type: String, maxlength: 250 },

    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.technology", timestamps: true });

module.exports = mongoose.model("Technology", technologySchema);
