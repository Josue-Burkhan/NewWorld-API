const mongoose = require("mongoose");

const abilitySchema = new mongoose.Schema({
  name: { type: String, required: true },

  description: String,
  type: String,
  element: String,
  cooldown: String,
  cost: String,
  level: String,
  requirements: String,
  effect: String,

  customNotes: { type: String, maxlength: 250 },

  // Relaciones principales
  characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  powerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
  story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  technology: { type: mongoose.Schema.Types.ObjectId, ref: "Technology" },
  creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  race: { type: mongoose.Schema.Types.ObjectId, ref: "Race" },

  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.ability", timestamps: true });

module.exports = mongoose.model("Ability", abilitySchema);
