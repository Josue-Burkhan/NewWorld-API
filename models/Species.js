const mongoose = require("mongoose");

//SPECIES
const speciesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  physicalTraits: [String],
  specialAbilities: [String],
  originStory: { type: String }
}, { collection: "newworld.species"});

module.exports = mongoose.model("Species", speciesSchema);
