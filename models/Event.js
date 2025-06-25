// 📁 /models/Event.js

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String },
  description: { type: String },
  customNotes: { type: String, maxlength: 250 },
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // --- VINCULACIONES (AHORA TODAS EN PLURAL, COMO ARRAYS Y CON RAW) ---
  characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  rawCharacters: [String],

  factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  rawFactions: [String],

  locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  rawLocations: [String],

  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  rawItems: [String],

  abilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  rawAbilities: [String],

  stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  rawStories: [String],

  powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
  rawPowerSystems: [String],

  creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  rawCreatures: [String],

  religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
  rawReligions: [String],

}, { collection: "newworld.event", timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
