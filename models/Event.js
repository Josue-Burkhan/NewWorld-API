const mongoose = require("mongoose");

//EVENTS
const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    year: { type: String, required: true }, // DI or DG format
    description: { type: String },
    impact: { type: String }
  }, {collection: "newworld.event"});
  
  module.exports = mongoose.model("Event", eventSchema);
  