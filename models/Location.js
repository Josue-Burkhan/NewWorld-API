const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },

  description: { type: String },
  climate: { type: String },
  terrain: { type: String },
  population: { type: Number },

  parentLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],

  economy: { type: String },
  language: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },
  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  technologyLevel: { type: String },

  customNotes: { type: String, maxlength: 250 },

  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.location", timestamps: true });

module.exports = mongoose.model("Location", locationSchema);
