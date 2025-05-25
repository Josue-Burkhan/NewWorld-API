const mongoose = require('mongoose');

const worldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,

  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },

  modules: {
    abilities: { type: Boolean, default: false },
    technology: { type: Boolean, default: false },
    powerSystem: { type: Boolean, default: false },
    creatures: { type: Boolean, default: false },
    religion: { type: Boolean, default: false },
    ancientHistory: { type: Boolean, default: false },
    races: { type: Boolean, default: false },
    economy: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('World', worldSchema);
