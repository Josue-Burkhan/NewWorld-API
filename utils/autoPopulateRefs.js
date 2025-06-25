// 📁 /utils/autoPopulateRefs.js

const mongoose = require('mongoose');

// No es necesario cambiar los modelos, están bien.
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
};

/**
 * La función findOrCreate no necesita cambios, está perfecta.
 */
async function findOrCreate(modelName, name, worldId, ownerId) {
    const Model = models[modelName];
    if (!name || !Model) return null;

    const existingDoc = await Model.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world: worldId });
    if (existingDoc) {
        return { id: existingDoc._id, isNew: false };
    }

    const newDoc = new Model({ name: name.trim(), world: worldId, owner: ownerId });
    await newDoc.save();
    return { id: newDoc._id, isNew: true };
}


async function autoPopulateReferences(body, ownerId) {
    const enrichedBody = { ...body };
    const worldId = body.world; 
    const newlyCreated = [];

    if (!worldId) {
        throw new Error("Cannot auto-populate references without a worldId in the request body.");
    }

    // *** INICIO DE LA CORRECCIÓN ***

    // 1. Corregimos los `ref` a plural y añadimos los mapeos de relaciones.
    const fieldMappings = [
        { ref: 'abilities',      raw: 'rawAbilities',   model: 'Ability',     isArray: true },
        { ref: 'items',          raw: 'rawItems',       model: 'Item',        isArray: true },
        { ref: 'languages',      raw: 'rawLanguages',   model: 'Language',    isArray: true },
        { ref: 'races',          raw: 'rawRace',        model: 'Race',        isArray: true },
        { ref: 'factions',       raw: 'rawFaction',     model: 'Faction',     isArray: true },
        { ref: 'locations',      raw: 'rawLocation',    model: 'Location',    isArray: true },
        { ref: 'powerSystems',   raw: 'rawPowerSystem', model: 'PowerSystem', isArray: true },
        { ref: 'religions',      raw: 'rawReligion',    model: 'Religion',    isArray: true },
        { ref: 'creatures',      raw: 'rawCreature',    model: 'Creature',    isArray: true },
        { ref: 'economies',      raw: 'rawEconomy',     model: 'Economy',     isArray: true },
        { ref: 'stories',        raw: 'rawStory',       model: 'Story',       isArray: true },

        { ref: 'relationships.family',   raw: 'rawFamily',   model: 'Character', isArray: true },
        { ref: 'relationships.friends',  raw: 'rawFriends',  model: 'Character', isArray: true },
        { ref: 'relationships.enemies',  raw: 'rawEnemies',  model: 'Character', isArray: true },
        { ref: 'relationships.romance',  raw: 'rawRomance',  model: 'Character', isArray: true },
    ];

    await Promise.all(fieldMappings.map(async (mapping) => {
        const rawValue = enrichedBody[mapping.raw];
        if (rawValue) {
            if (mapping.isArray) {
                const names = Array.isArray(rawValue) ? rawValue : [rawValue];
                const results = await Promise.all(
                    names.map(name => findOrCreate(mapping.model, name.trim(), worldId, ownerId))
                );
                
                results.forEach(result => {
                    if (result && result.isNew) {
                        newlyCreated.push({ model: mapping.model, id: result.id });
                    }
                });
                
                const ids = results.map(r => r.id).filter(id => id);

                // 2. Lógica mejorada para manejar campos anidados como 'relationships.family'
                if (mapping.ref.includes('.')) {
                    const [parent, child] = mapping.ref.split('.');
                    if (!enrichedBody[parent]) enrichedBody[parent] = {};
                    enrichedBody[parent][child] = ids;
                } else {
                    enrichedBody[mapping.ref] = ids;
                }

            } else { // Aunque no lo usas actualmente para 'character', lo mantenemos por si acaso
                const result = await findOrCreate(mapping.model, rawValue, worldId, ownerId);
                if (result) {
                    if (result.isNew) {
                        newlyCreated.push({ model: mapping.model, id: result.id });
                    }
                    enrichedBody[mapping.ref] = result.id;
                }
            }
            delete enrichedBody[mapping.raw];
        }
    }));
    
    // *** FIN DE LA CORRECCIÓN ***

    return { enrichedBody, newlyCreated };
}

module.exports = autoPopulateReferences;
