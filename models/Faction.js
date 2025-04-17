const mongoose = require("mongoose");

//FACTIONS
const factionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  alias: { type: String },
  purpose: { type: String, required: true },
  history: [{ year: String, description: String }],
  members: [String]
}, { collection: "newworld.faction"});

module.exports = mongoose.model("Faction", factionSchema);
