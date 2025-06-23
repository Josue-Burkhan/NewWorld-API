const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // Descripción general
  description: { type: String },
  type: { type: String },
  origin: { type: String },
  material: { type: String },
  weight: { type: Number },
  value: { type: String },
  rarity: { type: String },

  // Relacionado con el mundo y su historia
  characters: { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  associatedFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  associatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  associatedStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  foundInLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  powerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
  language: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },

  // Raw fields para autocompletar
  rawCreatedBy: String,
  rawUsedBy: [String],
  rawAssociatedFactions: [String],
  rawAssociatedEvents: [String],
  rawAssociatedStories: [String],
  rawFoundInLocations: [String],
  rawReligion: String,
  rawPowerSystem: String,
  rawLanguage: String,

  // Características especiales
  magicalProperties: [String],
  technologicalFeatures: [String],
  abilitiesGranted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  rawAbilitiesGranted: [String],
  customEffects: [String],

  // Extras
  isUnique: { type: Boolean, default: false },
  isDestroyed: { type: Boolean, default: false },
  currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
  rawCurrentOwner: String,

  // Texto libre adicional (máx. 250 caracteres)
  customNotes: { type: String, maxlength: 250 },

  // Propiedades necesarias
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { collection: "newworld.item", timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
