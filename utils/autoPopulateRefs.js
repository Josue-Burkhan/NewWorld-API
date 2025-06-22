// 📁 /utils/autoPopulateRefs.js

const mongoose = require('mongoose');

// 1. Importa TODOS los modelos que el personaje puede referenciar
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

/**
 * Busca una entidad por nombre dentro de un mundo específico. Si no la encuentra, la crea.
 * @param {String} modelName - El nombre del modelo (ej. "Ability").
 * @param {String} name - El nombre de la entidad a buscar/crear (ej. "Telequinesis").
 * @param {mongoose.Types.ObjectId} worldId - El ID del mundo al que pertenece.
 * @param {mongoose.Types.ObjectId} ownerId - El ID del usuario propietario.
 * @returns {Promise<mongoose.Types.ObjectId|null>} - El ID de la entidad.
 */
async function findOrCreate(modelName, name, worldId, ownerId) {
    const Model = models[modelName];
    if (!name || !Model) return null;

    // Busca una entidad existente que coincida en nombre y mundo (insensible a mayúsculas)
    const existingDoc = await Model.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        world: worldId
    });

    if (existingDoc) {
        return existingDoc._id; // Devuelve el ID si ya existe
    }

    // Si no existe, crea una nueva entidad con todos los datos requeridos
    const newDoc = new Model({
        name: name.trim(),
        world: worldId,
        owner: ownerId,
    });
    await newDoc.save();
    return newDoc._id;
}


/**
 * Procesa el cuerpo de la petición, convirtiendo todos los campos 'raw' en referencias de ID.
 * @param {Object} body - El req.body original.
 * @param {mongoose.Types.ObjectId} ownerId - El ID del usuario.
 * @returns {Promise<Object>} - El cuerpo de la petición con los campos 'raw' reemplazados por sus IDs.
 */
async function autoPopulateReferences(body, ownerId) {
    const enrichedBody = { ...body };
    const worldId = body.world; 
    
    if (!worldId) {
        // Si no hay worldId, no podemos continuar. Lanza un error.
        throw new Error("Cannot auto-populate references without a worldId in the request body.");
    }

    // 2. Un único mapa que define todas las relaciones
    const fieldMappings = [
        { ref: 'abilities',   raw: 'rawAbilities',   model: 'Ability',     isArray: true },
        { ref: 'weapons',     raw: 'rawWeapons',     model: 'Item',        isArray: true },
        { ref: 'race',        raw: 'rawRace',        model: 'Race',        isArray: false },
        { ref: 'faction',     raw: 'rawFaction',     model: 'Faction',     isArray: false },
        { ref: 'location',    raw: 'rawLocation',    model: 'Location',    isArray: false },
        { ref: 'powerSystem', raw: 'rawPowerSystem', model: 'PowerSystem', isArray: false },
        { ref: 'religion',    raw: 'rawReligion',    model: 'Religion',    isArray: false },
        { ref: 'creature',    raw: 'rawCreature',    model: 'Creature',    isArray: false },
        { ref: 'economy',     raw: 'rawEconomy',     model: 'Economy',     isArray: false },
        { ref: 'story',       raw: 'rawStory',       model: 'Story',       isArray: false },
    ];

    // 3. Procesa todos los campos en paralelo para mayor eficiencia
    await Promise.all(fieldMappings.map(async (mapping) => {
        const rawValue = enrichedBody[mapping.raw];
        
        if (rawValue) {
            if (mapping.isArray) {
                
                const names = rawValue.split(',').map(n => n.trim()).filter(Boolean);
                const ids = await Promise.all(
                    names.map(name => findOrCreate(mapping.model, name, worldId, ownerId))
                );
                enrichedBody[mapping.ref] = ids.filter(id => id);
            } else {

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
