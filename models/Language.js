const mongoose = require("mongoose");

const languageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  alphabet: { type: String },
  pronunciationRules: { type: String },
  grammarNotes: { type: String },

  // Relaciones con otras entidades
  usedByRaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Race" }],
  rawUsedByRaces: String,
  usedByFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  rawUsedByFactions: String,
  usedByCharacters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  rawUsedByCharacters: String,
  usedInRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  rawUsedInRegions: String,
  appearsInStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  rawAppearsInStories: String,
  relatedToReligion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  rawRelatedToReligion: String,

  // Extras
  isSacred: { type: Boolean, default: false },
  isExtinct: { type: Boolean, default: false },
  customNotes: { type: String, maxlength: 250 },

  // Propiedades necesarias
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.language", timestamps: true });

module.exports = mongoose.model("Language", languageSchema);
