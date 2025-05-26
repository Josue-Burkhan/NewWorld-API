const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String },
  description: { type: String },

  // Enlaces con otras entidades
  charactersInvolved: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  factionsInvolved: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faction" }],
  locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  itemsUsed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  abilitiesShown: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  relatedStories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  powerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
  creatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Creature" }],
  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },

  // Raw fields para autocompletar si no existe
  rawCharactersInvolved: String,
  rawFactionsInvolved: String,
  rawLocations: String,
  rawItemsUsed: String,
  rawAbilitiesShown: String,
  rawRelatedStories: String,
  rawPowerSystem: String,
  rawCreatures: String,
  rawReligion: String,

  customNotes: { type: String, maxlength: 250 },

  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { collection: "newworld.event", timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
