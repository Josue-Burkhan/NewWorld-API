const mongoose = require("mongoose");

//PLACES
const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // Kingdom, city, dimension, etc.
  location: { type: String },
  history: [{ year: String, description: String }],
  culture: {
    traditions: [String],
    language: { type: String },
    economy: { type: String },
    religion: { type: String }
  },
  notableFigures: [String]
}, { collection: "newworld.place"});

module.exports = mongoose.model("Place", placeSchema);
