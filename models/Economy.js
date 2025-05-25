const mongoose = require("mongoose");

const economySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, maxlength: 1000 },

    // Detalles económicos
    currency: {
        name: String,
        symbol: String,
        valueBase: String
    },
    tradeGoods: [String],
    keyIndustries: [String],
    economicSystem: String,

    // Relaciones con otras entidades
    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    races: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],

    // Texto libre adicional
    rawAssociations: [String],

    // Propiedades base
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.economy", timestamps: true });

module.exports = mongoose.model("Economy", economySchema);
