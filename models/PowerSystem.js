const mongoose = require("mongoose");

const powerSystemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },

  sourceOfPower: { type: String },
  rules: { type: String },
  limitations: { type: String },
  classificationTypes: [String],
  symbolsOrMarks: { type: String },

  usedByCharacters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  rawUsedByCharacters: [String],

  relatedAbilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  rawRelatedAbilities: [String],

  usedInFactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  rawUsedInFactions: [String],

  associatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  rawAssociatedEvents: [String],

  appearsInStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  rawAppearsInStories: [String],

  linkedCreatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  rawLinkedCreatures: [String],

  linkedReligion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  rawLinkedReligion: String,

  customNotes: { type: String, maxlength: 250 },

  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.powersystem", timestamps: true });

module.exports = mongoose.model("PowerSystem", powerSystemSchema);
