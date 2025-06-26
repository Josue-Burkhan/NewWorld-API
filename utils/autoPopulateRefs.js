// 📁 /utils/autoPopulateRefs.js

const mongoose = require('mongoose');

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
    Race: require("../models/Race"),
    Character: require("../models/Character"),
    Event: require("../models/Event"),
    Language: require("../models/Language"),
    Technology: require("../models/Technology"),
};

// La función findOrCreate está correcta, no necesita cambios.
async function findOrCreate(modelName, name, worldId, ownerId, cache) {
    const Model = models[modelName];
    if (!name || !Model) return null;

    const cacheKey = `${modelName.toLowerCase()}:${name.toLowerCase()}`;
    if (cache.has(cacheKey)) {
        return { id: cache.get(cacheKey), isNew: false };
    }

    const existingDoc = await Model.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world: worldId });
    if (existingDoc) {
        cache.set(cacheKey, existingDoc._id);
        return { id: existingDoc._id, isNew: false };
    }

    const newDoc = new Model({ name: name.trim(), world: worldId, owner: ownerId });
    await newDoc.save();
    cache.set(cacheKey, newDoc._id);
    return { id: newDoc._id, isNew: true };
}


async function autoPopulateReferences(body, ownerId) {
    const enrichedBody = { ...body };
    const worldId = body.world; 
    const processedInThisRequest = new Map();

    if (!worldId) {
        throw new Error("Cannot auto-populate references without a worldId in the request body.");
    }
    
    // El mapeo que hiciste está excelente y cubre todos los casos.
    const fieldMappings = [
        { ref: 'abilities',      raw: 'rawAbilities',       model: 'Ability',       isArray: true },
        { ref: 'items',          raw: 'rawItems',           model: 'Item',          isArray: true },
        { ref: 'languages',      raw: 'rawLanguages',       model: 'Language',      isArray: true },
        { ref: 'races',          raw: 'rawRace',            model: 'Race',          isArray: true },
        { ref: 'factions',       raw: 'rawFaction',         model: 'Faction',       isArray: true },
        { ref: 'locations',      raw: 'rawLocation',        model: 'Location',      isArray: true },
        { ref: 'powerSystems',   raw: 'rawPowerSystem',     model: 'PowerSystem',   isArray: true },
        { ref: 'religions',      raw: 'rawReligion',        model: 'Religion',      isArray: true },
        { ref: 'creatures',      raw: 'rawCreature',        model: 'Creature',      isArray: true },
        { ref: 'economies',      raw: 'rawEconomy',         model: 'Economy',       isArray: true },
        { ref: 'stories',        raw: 'rawStory',           model: 'Story',         isArray: true },
        { ref: 'technologies',   raw: 'rawTechnologies',    model: 'Technology',    isArray: true },

        // Campos de Character
        { ref: 'history.birthplace',        raw: 'rawBirthplace',    model: 'Location',     isArray: false },
        { ref: 'relationships.family',      raw: 'rawFamily',        model: 'Character',    isArray: true },
        { ref: 'relationships.friends',     raw: 'rawFriends',       model: 'Character',    isArray: true },
        { ref: 'relationships.enemies',     raw: 'rawEnemies',       model: 'Character',    isArray: true },
        { ref: 'relationships.romance',     raw: 'rawRomance',       model: 'Character',    isArray: true },

        // Campos de Item
        { ref: 'createdBy',              raw: 'rawCreatedBy',               model: 'Character',  isArray: true },
        { ref: 'usedBy',                 raw: 'rawUsedBy',                  model: 'Character',  isArray: true },
        { ref: 'currentOwnerCharacter',  raw: 'rawCurrentOwnerCharacter',   model: 'Character',  isArray: true },

        // Campos de Faction
        { ref: 'allies',         raw: 'rawAllies',          model: 'Faction',       isArray: true },
        { ref: 'enemies',        raw: 'rawEnemies',         model: 'Faction',       isArray: true },
        { ref: 'headquarters',   raw: 'rawHeadquarters',    model: 'Location',      isArray: true },
        { ref: 'territory',      raw: 'rawTerritory',       model: 'Location',      isArray: true },
    ];

    for (const mapping of fieldMappings) {
        const rawValue = enrichedBody[mapping.raw];
        if (rawValue) {
            let results;
            if (mapping.isArray) {
                const names = Array.isArray(rawValue) ? rawValue : [rawValue];

                results = await Promise.all(
                    names.map(name => findOrCreate(mapping.model, name.trim(), worldId, ownerId, processedInThisRequest))
                );
            } else {
                results = [await findOrCreate(mapping.model, rawValue.trim(), worldId, ownerId, processedInThisRequest)];
            }
            
            const validIds = results.filter(r => r && r.id).map(r => r.id);

            if (validIds.length > 0) {
                 if (mapping.ref.includes('.')) {
                    const [parent, child] = mapping.ref.split('.');
                    if (!enrichedBody[parent]) enrichedBody[parent] = {};
                    enrichedBody[parent][child] = mapping.isArray ? validIds : validIds[0];
                } else {
                    enrichedBody[mapping.ref] = mapping.isArray ? validIds : validIds[0];
                }
            }
            delete enrichedBody[mapping.raw];
        }
    }
    
    return { enrichedBody };
}

module.exports = autoPopulateReferences;
