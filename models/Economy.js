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

    // Relaciones
    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    races: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],

    // Campos raw al mismo nivel
    rawCharacters: String,
    rawFactions: String,
    rawLocations: String,
    rawItems: String,
    rawRaces: String,
    rawStories: String,

    rawAssociations: [String], // Esto lo dejas si lo usas para algo específico

    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.economy", timestamps: true });

module.exports = mongoose.model("Economy", economySchema);
