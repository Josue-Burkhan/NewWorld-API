const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },

  description: { type: String },
  climate: { type: String },
  terrain: { type: String },
  population: { type: Number },

  parentLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  rawParentLocation: String,

  factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  rawFactions: [String],

  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  rawEvents: [String],

  characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  rawCharacters: [String],

  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  rawItems: [String],

  creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  rawCreatures: [String],

  stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  rawStories: [String],

  economy: { type: String },
  language: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },
  rawLanguage: String,

  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  rawReligion: String,

  technologyLevel: { type: String },

  customNotes: { type: String, maxlength: 250 },

  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.location", timestamps: true });

module.exports = mongoose.model("Location", locationSchema);
