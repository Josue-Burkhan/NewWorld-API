const mongoose = require("mongoose");

//ABILITIES
const abilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  elements: [
    {
      element: { type: String, required: true },
      orbs: { type: Number, required: true },
      _id: false
    }
  ],
  charactersWhoUse: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
},
  { collection: "newworld.ability" }
);

module.exports = mongoose.model("Ability", abilitySchema);

