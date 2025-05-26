const mongoose = require("mongoose");

const factionSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // Descripción general
  description: { type: String },
  type: { type: String },
  symbol: { type: String },

  // Relaciones clave
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  allies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  headquarters: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  involvedInEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  associatedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  associatedStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  language: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },
  powerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
  territory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],

  // Raw fields para autocompletar
  rawMembers: String,
  rawAllies: String,
  rawEnemies: String,
  rawHeadquarters: String,
  rawInvolvedInEvents: String,
  rawAssociatedItems: String,
  rawAssociatedStories: String,
  rawReligion: String,
  rawLanguage: String,
  rawPowerSystem: String,
  rawTerritory: String,

  economySystem: { type: String },
  technology: { type: String },
  goals: [String],
  history: { type: String },

  customNotes: { type: String, maxlength: 250 },

  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.faction", timestamps: true });

module.exports = mongoose.model("Faction", factionSchema);
