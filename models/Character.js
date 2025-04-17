const mongoose = require("mongoose");

const characterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  race: { type: String, required: true },
  nickname: { type: String },
  appearance: {
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    eyeColor: { type: String },
    hairColor: { type: String },
    clothingStyle: { type: String }
  },
  personality: {
    traits: [String],
    strengths: [String],
    weaknesses: [String],
    quirks: [String]
  },
  history: {
    birthplace: { type: String },
    events: [
      {
        year: { type: Number, required: true },
        description: String,
        _id: false
      }]
  },
  relationships: {
    family: [String],
    friends: [String],
    enemies: [String],
    allies: [String],
    romance: [String]
  },
  abilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  coreRank: { type: String },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
},
  { collection: "newworld.character" });

module.exports = mongoose.model("Character", characterSchema);