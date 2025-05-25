const mongoose = require("mongoose");

const technologySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,

    techType: { type: String }, // ejemplo: armamento, transporte, comunicaciones
    origin: { type: String },   // quién la creó o cómo surgió
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
    yearCreated: Number,
    currentUse: String,         // usos comunes o actuales
    limitations: String,
    energySource: String,       // si usa alguna fuente de energía

    // Relaciones
    usedByCharacters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    usedByFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    linkedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    linkedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    appearsInStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    createdInLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    relatedPowerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },

    notes: { type: String, maxlength: 250 },

    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.technology", timestamps: true });

module.exports = mongoose.model("Technology", technologySchema);
