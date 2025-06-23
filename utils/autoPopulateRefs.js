// 📁 /utils/autoPopulateRefs.js

const mongoose = require('mongoose');

// 1. Importa TODOS los modelos que podrías necesitar referenciar
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
    Character: require("../models/Character"), // Se añade Character para referencias como 'createdBy'
    Event: require("../models/Event"),         // Se añade Event
};

// ... (la función findOrCreate no necesita cambios) ...
async function findOrCreate(modelName, name, worldId, ownerId) {
    const Model = models[modelName];
    if (!name || !Model) return null;
    const existingDoc = await Model.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world: worldId });
    if (existingDoc) return existingDoc._id;
    const newDoc = new Model({ name: name.trim(), world: worldId, owner: ownerId });
    await newDoc.save();
    return newDoc._id;
}


async function autoPopulateReferences(body, ownerId) {
    const enrichedBody = { ...body };
    const worldId = body.world; 
    
    if (!worldId) {
        throw new Error("Cannot auto-populate references without a worldId in the request body.");
    }

    // 2. LISTA DE INSTRUCCIONES UNIVERSAL
    const fieldMappings = [
        // Campos de Character
        { ref: 'abilities',   raw: 'rawAbilities',   model: 'Ability',     isArray: true },
        { ref: 'item',        raw: 'rawItems',       model: 'Item',        isArray: true },
        { ref: 'race',        raw: 'rawRace',        model: 'Race',        isArray: false },
        { ref: 'faction',     raw: 'rawFaction',     model: 'Faction',     isArray: false },
        { ref: 'location',    raw: 'rawLocation',    model: 'Location',    isArray: false },
        { ref: 'powerSystem', raw: 'rawPowerSystem', model: 'PowerSystem', isArray: false },
        { ref: 'religion',    raw: 'rawReligion',    model: 'Religion',    isArray: false },
        { ref: 'creature',    raw: 'rawCreature',    model: 'Creature',    isArray: false },
        { ref: 'economy',     raw: 'rawEconomy',     model: 'Economy',     isArray: false },
        { ref: 'story',       raw: 'rawStory',       model: 'Story',       isArray: false },
        
        // Campos de Item (y otros modelos)
        { ref: 'createdBy',           raw: 'rawCreatedBy',           model: 'Character',   isArray: false },
        { ref: 'usedBy',              raw: 'rawUsedBy',              model: 'Character',   isArray: true },
        { ref: 'associatedFactions',  raw: 'rawAssociatedFactions',  model: 'Faction',     isArray: true },
        { ref: 'associatedEvents',    raw: 'rawAssociatedEvents',    model: 'Event',       isArray: true },
        { ref: 'associatedStories',   raw: 'rawAssociatedStories',   model: 'Story',       isArray: true },
        { ref: 'foundInLocations',    raw: 'rawFoundInLocations',    model: 'Location',    isArray: true },
        // ...puedes seguir añadiendo más reglas aquí para otros modelos...
    ];

    await Promise.all(fieldMappings.map(async (mapping) => {
        const rawValue = enrichedBody[mapping.raw];
        
        if (rawValue) {
            if (mapping.isArray) {
                // Si es un array (como rawAbilities o rawUsedBy)
                const names = Array.isArray(rawValue) ? rawValue : [rawValue];
                const ids = await Promise.all(
                    names.map(name => findOrCreate(mapping.model, name.trim(), worldId, ownerId))
                );
                enrichedBody[mapping.ref] = ids.filter(id => id);
            } else {
                // Si es un solo valor (como rawFaction o rawCreatedBy)
                const id = await findOrCreate(mapping.model, rawValue, worldId, ownerId);
                if (id) {
                    enrichedBody[mapping.ref] = id;
                }
            }
            delete enrichedBody[mapping.raw];
        }
    }));

    return enrichedBody;
}

module.exports = autoPopulateReferences;
