const mongoose = require("mongoose");

const factionSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // Descripción general
  description: { type: String },
  type: { type: String }, // ej: imperio, gremio, corporación, clan, etc.
  symbol: { type: String }, // podría usarse como URL a una imagen o descripción

  // Relaciones clave
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  allies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  headquarters: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  involvedInEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  associatedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  associatedStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  economySystem: { type: String },
  language: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },

  // Extras
  powerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
  technology: { type: String },
  territory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  goals: [String],
  history: { type: String },

  // Texto libre opcional (máx. 250 caracteres)
  customNotes: { type: String, maxlength: 250 },

  // Propiedades necesarias
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.faction", timestamps: true });

module.exports = mongoose.model("Faction", factionSchema);
