// 📁 /models/Economy.js

const mongoose = require("mongoose");

const economySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, maxlength: 1000 },

    currency: {
        name: String,
        symbol: String,
        valueBase: String
    },
    tradeGoods: [String],
    keyIndustries: [String],
    economicSystem: String,

    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES (AHORA TODAS EN PLURAL Y COMO ARRAYS) ---
    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCharacters: [String],

    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawFactions: [String],

    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawLocations: [String],

    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    rawItems: [String],

    races: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
    rawRaces: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

}, { collection: "newworld.economy", timestamps: true });

module.exports = mongoose.model("Economy", economySchema);
