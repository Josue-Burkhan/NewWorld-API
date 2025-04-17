const mongoose = require("mongoose");

//ITEMS
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  specialAbilities: [String],
  history: [{ year: String, description: String }],
  previousOwners: [String]
}, { collection: "newworld.item" });

module.exports = mongoose.model("Item", itemSchema);
