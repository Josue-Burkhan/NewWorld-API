// 📁 /models/Item.js

const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String },
    origin: { type: String },
    material: { type: String },
    weight: { type: Number },
    value: { type: String },
    rarity: { type: String },
    magicalProperties: [String],
    technologicalFeatures: [String],
    customEffects: [String],
    isUnique: { type: Boolean, default: false },
    isDestroyed: { type: Boolean, default: false },
    customNotes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES (AHORA TODAS EN PLURAL, COMO ARRAYS Y CON RAW) ---
    createdBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCreatedBy: [String],

    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawUsedBy: [String],

    currentOwnerCharacter: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCurrentOwnerCharacter: [String],

    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawFactions: [String],

    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    rawEvents: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawLocations: [String],

    religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
    rawReligions: [String],

    powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    rawPowerSystems: [String],

    languages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Language" }],
    rawLanguages: [String],

    abilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
    rawAbilities: [String],

}, { collection: "newworld.item", timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
