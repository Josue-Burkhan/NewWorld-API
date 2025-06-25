// 📁 /models/Language.js

const mongoose = require("mongoose");

const languageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    alphabet: { type: String },
    pronunciationRules: { type: String },
    grammarNotes: { type: String },
    isSacred: { type: Boolean, default: false },
    isExtinct: { type: Boolean, default: false },
    customNotes: { type: String, maxlength: 250 },
    world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- VINCULACIONES (AHORA TODAS EN PLURAL, COMO ARRAYS Y CON RAW) ---
    races: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
    rawRaces: [String],

    factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
    rawFactions: [String],

    characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    rawCharacters: [String],

    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    rawLocations: [String],

    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
    rawStories: [String],

    religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
    rawReligions: [String],

}, { collection: "newworld.language", timestamps: true });

module.exports = mongoose.model("Language", languageSchema);
