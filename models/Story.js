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
  locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  factions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  abilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  powerSystems: [{ type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" }],
  creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  religions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Religion" }],
  technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technology" }],
  races: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
  economies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Economy" }],

  // Texto libre por si el usuario desea agregar algo no estructurado
  rawAssociations: [String],

  // Propiedades base
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.story", timestamps: true });

module.exports = mongoose.model("Story", storySchema);
