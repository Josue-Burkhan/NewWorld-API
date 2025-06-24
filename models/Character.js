// 📁 /models/Character.js

const mongoose = require("mongoose");

const characterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: Number,
    gender: String,
    nickname: String,
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    appearance: {
        height: Number,
        weight: Number,
        eyeColor: String,
        hairColor: String,
        clothingStyle: String,
    },

    personality: {
        traits: [String],
        strengths: [String],
        weaknesses: [String],
    },

    history: {
        birthplace: String,
        events: [{
            year: Number,
            description: String,
            _id: false
        }]
    },

    customNotes: { type: String, maxlength: 250 },

    // --- RELACIONES (AHORA CON RAW) ---
    relationships: {
        family: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
        rawFamily: [String],
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
        rawFriends: [String],
        enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
        rawEnemies: [String],
        romance: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
        rawRomance: [String],
    },

    // --- VINCULACIONES (TODAS EN PLURAL Y COMO ARRAYS) ---
    abilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
    rawAbilities: [String],

    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
    rawItems: [String],

    languages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Language" }],
    rawLanguages: [String],

    races: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
    rawRaces: [String],

    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawFactions: [String],

    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawLocations: [String],

    powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
    rawPowerSystems: [String],

    religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
    rawReligions: [String],

    creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
    rawCreatures: [String],

    economies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Economy" }],
    rawEconomies: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

}, { collection: "newworld.character", timestamps: true });

module.exports = mongoose.model("Character", characterSchema);
