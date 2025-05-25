const mongoose = require("mongoose");

const powerSystemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },

  sourceOfPower: { type: String },  // ejemplo: "energía espiritual", "nanotecnología"
  rules: { type: String },          // reglas de uso
  limitations: { type: String },    // restricciones, costos, debilidades
  classificationTypes: [String],   // tipos: elemental, mental, físico, etc.
  symbolsOrMarks: { type: String },

  // Relación con otras entidades
  usedByCharacters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  relatedAbilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  usedInFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  associatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  appearsInStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  linkedCreatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  linkedReligion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },

  // Texto libre
  customNotes: { type: String, maxlength: 250 },

  // Propiedades necesarias
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.powersystem", timestamps: true });

module.exports = mongoose.model("PowerSystem", powerSystemSchema);
