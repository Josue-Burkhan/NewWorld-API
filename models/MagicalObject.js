const mongoose = require("mongoose");

//MAGIC OBJECTS
const magicalObjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  abilities: [String],
  history: [{ year: String, description: String }],
  knownUsers: [String]
}, { collection: "newworld.magicalobject"});

module.exports = mongoose.model("MagicalObject", magicalObjectSchema);
