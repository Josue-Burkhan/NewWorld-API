const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // Descripción general
  description: { type: String },
  type: { type: String }, // ej: arma, armadura, artefacto, herramienta, comida, etc.
  origin: { type: String },
  material: { type: String },
  weight: { type: Number },
  value: { type: String }, // puede ser texto tipo "muy valioso", o número
  rarity: { type: String }, // ej: común, raro, legendario, etc.

  // Relacionado con el mundo y su historia
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  associatedFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  associatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  associatedStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  foundInLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  powerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
  language: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },

  // Características especiales
  magicalProperties: [String],
  technologicalFeatures: [String],
  abilitiesGranted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  customEffects: [String],

  // Extras
  isUnique: { type: Boolean, default: false },
  isDestroyed: { type: Boolean, default: false },
  currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: "Character" },

  // Texto libre adicional (máx. 250 caracteres)
  customNotes: { type: String, maxlength: 250 },

  // Propiedades necesarias
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.item", timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
