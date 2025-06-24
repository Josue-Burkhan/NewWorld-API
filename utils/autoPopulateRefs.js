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
    Language: require("../models/Language"), // Añadido Language que estaba en tu lista
};

/**
 * CAMBIO: Ahora devuelve un objeto {id, isNew} para saber si el documento se acaba de crear.
 */
async function findOrCreate(modelName, name, worldId, ownerId) {
    const Model = models[modelName];
    if (!name || !Model) return null;

    const existingDoc = await Model.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, world: worldId });
    if (existingDoc) {
        // Devuelve el ID y una bandera 'isNew: false'
        return { id: existingDoc._id, isNew: false };
    }

    const newDoc = new Model({ name: name.trim(), world: worldId, owner: ownerId });
    await newDoc.save();
    // Devuelve el ID y una bandera 'isNew: true'
    return { id: newDoc._id, isNew: true };
}

/**
 * CAMBIO: Ahora devuelve el body enriquecido Y una lista de las entidades que se acaban de crear.
 */
async function autoPopulateReferences(body, ownerId) {
    const enrichedBody = { ...body };
    const worldId = body.world; 
    const newlyCreated = [];

    if (!worldId) {
        throw new Error("Cannot auto-populate references without a worldId in the request body.");
    }

    // Usamos tu lista de mapeo, que es la más completa y correcta.
    const fieldMappings = [
        { ref: 'characters',  raw: 'rawCharacters',  model: 'Character',   isArray: true },
        { ref: 'abilities',   raw: 'rawAbilities',   model: 'Ability',     isArray: true },
        { ref: 'items',       raw: 'rawItems',       model: 'Item',        isArray: true },
        { ref: 'languages',   raw: 'rawLanguages',   model: 'Language',    isArray: true },
        { ref: 'race',        raw: 'rawRace',        model: 'Race',        isArray: true },
        { ref: 'faction',     raw: 'rawFaction',     model: 'Faction',     isArray: true },
        { ref: 'location',    raw: 'rawLocation',    model: 'Location',    isArray: true },
        { ref: 'powerSystem', raw: 'rawPowerSystem', model: 'PowerSystem', isArray: true },
        { ref: 'religion',    raw: 'rawReligion',    model: 'Religion',    isArray: true },
        { ref: 'creature',    raw: 'rawCreature',    model: 'Creature',    isArray: true },
        { ref: 'economy',     raw: 'rawEconomy',     model: 'Economy',     isArray: true },
        { ref: 'story',       raw: 'rawStory',       model: 'Story',       isArray: true },

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
                        // Si es nuevo, lo añade a la lista para vincular de vuelta
                        newlyCreated.push({ model: mapping.model, id: result.id });
                    }
                });
                enrichedBody[mapping.ref] = results.map(r => r.id).filter(id => id);

            } else {
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

    // Devuelve ambos: el cuerpo listo para guardar, y la lista de IDs a actualizar.
    return { enrichedBody, newlyCreated };
}

module.exports = autoPopulateReferences;