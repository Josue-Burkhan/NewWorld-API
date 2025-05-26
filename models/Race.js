const mongoose = require("mongoose");

const raceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  traits: [String],
  lifespan: String,
  averageHeight: String,
  averageWeight: String,
  culture: String,

  language: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },
  rawLanguage: String,

  // Vinculaciones
  characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  rawCharacters: [String],

  locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  rawLocations: [String],

  religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
  rawReligions: [String],

  stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  rawStories: [String],

  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  rawEvents: [String],

  powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
  rawPowerSystems: [String],

  // Identificación
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { collection: "newworld.race", timestamps: true });

module.exports = mongoose.model("Race", raceSchema);
