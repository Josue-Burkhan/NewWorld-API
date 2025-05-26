const mongoose = require("mongoose");
const models = {
  Ability: require("../models/Ability"),
  Item: require("../models/Item"),
  Faction: require("../models/Faction"),
  Location: require("../models/Location"),
  PowerSystem: require("../models/PowerSystem"),
  Religion: require("../models/Religion"),
  Creature: require("../models/Creature"),
  Economy: require("../models/Economy"),
  Story: require("../models/Story"),
  Race: require("../models/Race")
};

const refFields = {
  abilities: "Ability",
  weapons: "Item",
  faction: "Faction",
  location: "Location",
  powerSystem: "PowerSystem",
  religion: "Religion",
  creature: "Creature",
  economy: "Economy",
  story: "Story",
  race: "Race"
};

const rawToRefMapping = {
  abilities: "rawAbilities",
  weapons: "rawWeapons",
  faction: "rawFactions",
  location: "rawLocation",
  powerSystem: "rawPowerSystem",
  religion: "rawReligion",
  creature: "rawCreature",
  economy: "rawEconomy",
  story: "rawStory",
  race: "rawRace"
};

async function createIfNotExists(modelName, name, userId) {
  const Model = models[modelName];
  const existing = await Model.findOne({ name, owner: userId });
  if (existing) return existing._id;
  const newDoc = new Model({ name, owner: userId });
  await newDoc.save();
  return newDoc._id;
}

async function autoPopulateRefs(data, userId) {
  const updatedData = { ...data };

  for (const [field, modelName] of Object.entries(refFields)) {
    const rawField = rawToRefMapping[field];
    const isArrayField = Array.isArray(data[field]) || Array.isArray(data[rawField]?.split?.(","));

    if (!data[field] && data[rawField]) {
      const names = data[rawField].split(",").map(n => n.trim()).filter(Boolean);

      const ids = await Promise.all(names.map(name => createIfNotExists(modelName, name, userId)));

      updatedData[field] = isArrayField ? ids : ids[0];
      delete updatedData[rawField];
    }
  }

  return updatedData;
}

module.exports = autoPopulateRefs;
