const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, maxlength: 1000 },

  // Línea de tiempo de eventos clave
  timeline: [
    {
      year: Number,
      event: String,
      _id: false
    }
  ],

  // Elementos vinculados a la historia
  characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  rawCharacters: [String],

  locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  rawLocations: [String],

  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  rawItems: [String],

  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  rawEvents: [String],

  factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  rawFactions: [String],

  abilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  rawAbilities: [String],

  powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
  rawPowerSystems: [String],

  creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  rawCreatures: [String],

  religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
  rawReligions: [String],

  technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technology" }],
  rawTechnologies: [String],

  races: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
  rawRaces: [String],

  economies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Economy" }],
  rawEconomies: [String],

  rawAssociations: [String],

  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.story", timestamps: true });

module.exports = mongoose.model("Story", storySchema);
