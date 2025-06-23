const mongoose = require("mongoose");

const creatureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    speciesType: { type: String },
    description: { type: String },
    habitat: { type: String },
    behavior: { type: String },
    abilities: [String],
    weaknesses: [String],
    domesticated: { type: Boolean, default: false },

    // Relaciones
    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    associatedFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    linkedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    appearsInStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    originLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    relatedPowerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
    associatedReligion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },

    // Campos raw alineados al mismo nivel
    rawAssociatedFactions: [String],
    rawLinkedEvents: [String],
    rawAppearsInStories: [String],
    rawOriginLocation: String,
    rawRelatedPowerSystem: String,
    rawAssociatedReligion: String,

    // Notas
    customNotes: { type: String, maxlength: 250 },

    // Propiedades necesarias
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, {
    collection: "newworld.creature",
    timestamps: true
});

module.exports = mongoose.model("Creature", creatureSchema);
