const mongoose = require("mongoose");

const characterSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // Datos generales
  age: Number,
  gender: String,
  nickname: String,

  // Relación con el mundo
  world: { type: mongoose.Schema.Types.ObjectId, ref: "World", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Raza
  race: { type: mongoose.Schema.Types.ObjectId, ref: "Race" },
  rawRace: String,

  // Apariencia física
  appearance: {
    height: Number,
    weight: Number,
    eyeColor: String,
    hairColor: String,
    clothingStyle: String,
  },

  // Personalidad
  personality: {
    traits: [String],
    strengths: [String],
    weaknesses: [String],
    quirks: [String],
  },

  // Historia
  history: {
    birthplace: String,
    events: [
      {
        year: Number,
        description: String,
        _id: false
      }
    ]
  },

  customNotes: { type: String, maxlength: 250 },

  // Relaciones con otros personajes
  relationships: {
    family: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    romance: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }]
  },

  // Vinculaciones con otras entidades
  abilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ability" }],
  rawAbilities: [String],

  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }],
  rawItems: [String],

  faction: { type: mongoose.Schema.Types.ObjectId, ref: "Faction" },
  rawFaction: String,

  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  rawLocation: String,

  powerSystem: { type: mongoose.Schema.Types.ObjectId, ref: "PowerSystem" },
  rawPowerSystem: String,

  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion" },
  rawReligion: String,

  creature: { type: mongoose.Schema.Types.ObjectId, ref: "Creature" },
  rawCreature: String,

  economy: { type: mongoose.Schema.Types.ObjectId, ref: "Economy" },
  rawEconomy: String,

  story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
  rawStory: String

}, { collection: "newworld.character", timestamps: true });

module.exports = mongoose.model("Character", characterSchema);
