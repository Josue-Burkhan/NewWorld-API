const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Ability = require("../models/Ability");
const Character = require("../models/Character");
const authMiddleware = require("../middleware/authMiddleware");

// GET all characters for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
  /*
    #swagger.tags = ['Characters']
    #swagger.description = 'Retrieve all characters associated with the authenticated user.'
    #swagger.security = [{ "BearerAuth": [] }]
    #swagger.responses[200] = { 
      description: 'Successfully retrieved characters', 
      schema: [{ 
        _id: 'string', 
        name: 'string', 
        age: 'number', 
        gender: 'string', 
        race: 'string', 
        nickname: 'string', 
        appearance: { 
          height: 'number', 
          weight: 'number', 
          eyeColor: 'string', 
          hairColor: 'string', 
          clothingStyle: 'string' 
        }, 
        personality: { 
          traits: ['string'], 
          strengths: ['string'], 
          weaknesses: ['string'], 
          quirks: ['string'] 
        }, 
        history: { 
          birthplace: 'string', 
          events: [{ year: 'number', description: 'string' }] 
        }, 
        relationships: { 
          family: ['string'], 
          friends: ['string'], 
          enemies: ['string'], 
          allies: ['string'], 
          romance: ['string'] 
        }, 
        abilities: [{ 
          _id: 'string', 
          name: 'string', 
          elements: [{ element: 'string', orbs: 0 }] 
        }], 
        coreRank: 'string' 
      }] 
    }
    #swagger.responses[401] = { 
      description: 'Unauthorized - No token provided or invalid', 
      schema: { message: 'No token provided or invalid' } 
    }
    #swagger.responses[500] = { 
      description: 'Server error', 
      schema: { message: 'Error retrieving characters', error: {} } 
    }
  */
  try {
    const characters = await Character.find({ owner: req.user.userId })
      .populate({
        path: "abilities",
        select: "name elements",
        options: { strictPopulate: false }
      });

    res.json(characters);
  } catch (error) {
    console.error("Error retrieving characters:", error);
    if (!req.user || !req.user.userId) {
      return res.status(400).json({ message: "Bad Request - Missing user ID" });
    }
    res.status(500).json({ message: "Error retrieving characters", error: error.message });
  }
});


// GET  ID
router.get("/:id", authMiddleware, async (req, res) => {
  /*  
    #swagger.tags = ['Characters']  
    #swagger.description = 'Retrieve a character by ID, with authentication and validation.'  
    #swagger.security = [{ "BearerAuth": [] }]  
    #swagger.parameters['id'] = { 
      in: 'path', 
      description: 'Character ID (must be a valid MongoDB ObjectId)', 
      required: true, 
      type: 'string' 
    }  
    #swagger.responses[200] = { 
      description: 'Character data retrieved successfully', 
      schema: { 
        _id: 'string', 
        name: 'string', 
        age: 'number', 
        gender: 'string', 
        race: 'string', 
        nickname: 'string', 
        appearance: { 
          height: 'number', 
          weight: 'number', 
          eyeColor: 'string', 
          hairColor: 'string', 
          clothingStyle: 'string' 
        }, 
        personality: { 
          traits: ['string'], 
          strengths: ['string'], 
          weaknesses: ['string'], 
          quirks: ['string'] 
        }, 
        history: { 
          birthplace: 'string', 
          events: [{ year: 'number', description: 'string' }] 
        }, 
        relationships: { 
          family: ['string'], 
          friends: ['string'], 
          enemies: ['string'], 
          allies: ['string'], 
          romance: ['string'] 
        }, 
        abilities: [{ 
          name: 'string', 
          elements: [{ element: 'string', orbs: 'number' }] 
        }], 
        coreRank: 'string' 
      } 
    }  
    #swagger.responses[400] = { 
      description: 'Invalid character ID', 
      schema: { message: 'Invalid character ID' } 
    }  
    #swagger.responses[404] = { 
      description: 'Character not found', 
      schema: { message: 'Character not found' } 
    }  
    #swagger.responses[500] = { 
      description: 'Server error', 
      schema: { message: 'Server error', error: {} } 
    }  
  */
  try {
    console.log("Requested ID:", req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid character ID" });
    }

    const character = await Character.findOne({ _id: req.params.id })
      .populate("abilities");

    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    res.json(character);
  } catch (error) {
    console.error("Error retrieving character:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// POST
router.post("/", async (req, res) => {
  /*  
    #swagger.tags = ['Characters']  
    #swagger.description = 'Create a new character associated with the authenticated user.'  
    #swagger.security = [{ "BearerAuth": [] }]  
    #swagger.parameters['body'] = {  
      in: 'body',  
      description: 'Character data',  
      required: true,  
      schema: {  
        name: 'string',  
        age: 0,  
        gender: 'string',  
        race: 'string',  
        nickname: 'string',  
        appearance: {  
          height: 0,  
          weight: 0,  
          eyeColor: 'string',  
          hairColor: 'string',  
          clothingStyle: 'string'  
        },  
        personality: {  
          traits: ['string'],  
          strengths: ['string'],  
          weaknesses: ['string'],  
          quirks: ['string']  
        },  
        history: {  
          birthplace: 'string',  
          events: [{ year: 0, description: 'string' }]  
        },  
        relationships: {  
          family: ['string'],  
          friends: ['string'],  
          enemies: ['string'],  
          allies: ['string'],  
          romance: ['string']  
        },  
        abilities: ['string'],  
        coreRank: 'string' 
      }  
    }  
    #swagger.responses[201] = {  
      description: 'Character created successfully',  
      schema: {  
        _id: 'string',  
        name: 'string',  
        age: 0,  
        gender: 'string',  
        race: 'string',  
        nickname: 'string',  
        appearance: {  
          height: 0,  
          weight: 0,  
          eyeColor: 'string',  
          hairColor: 'string',  
          clothingStyle: 'string'  
        },  
        personality: {  
          traits: ['string'],  
          strengths: ['string'],  
          weaknesses: ['string'],  
          quirks: ['string']  
        },  
        history: {  
          birthplace: 'string',  
          events: [{ year: 0, description: 'string' }]  
        },  
        relationships: {  
          family: ['string'],  
          friends: ['string'],  
          enemies: ['string'],  
          allies: ['string'],  
          romance: ['string']  
        },  
        abilities: ['string'],  
        coreRank: 'string',  
        owner: 'string'  
      }  
    }  
    #swagger.responses[400] = {  
      description: 'Error creating character',  
      schema: { message: 'Error creating character', error: {} }  
    }  
    #swagger.responses[401] = {  
      description: 'Unauthorized - No token provided or invalid',  
      schema: { message: 'No token provided or invalid' }  
    }  
  */
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (req.body.abilities && !Array.isArray(req.body.abilities)) {
      return res.status(400).json({ message: "Abilities must be an array of IDs" });
    }

    const formattedCharacter = {
      ...req.body,
      age: Number(req.body.age) || 0,
      appearance: {
        ...req.body.appearance,
        height: Number(req.body.appearance?.height) || 0,
        weight: Number(req.body.appearance?.weight) || 0,
        eyeColor: req.body.appearance?.eyeColor || "",
        hairColor: req.body.appearance?.hairColor || "",
        clothingStyle: req.body.appearance?.clothingStyle || "",
      },
      history: {
        ...req.body.history,
        birthplace: req.body.history?.birthplace || "",
        events: (req.body.history?.events || []).map((event) => ({
          ...event,
          year: Number(event.year) || 0,
          description: event.description || "",
        })),
      },
      owner: userId,
    };

    const newCharacter = new Character(formattedCharacter);
    await newCharacter.save();
    res.status(201).json(newCharacter);
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", error: error.message });
    } else {
      res.status(500).json({ message: "Error creating character", error: error.message });
    }
  }
});




// PUT - Update a character by ID
router.put("/:id", authMiddleware, async (req, res) => {
  /**
    #swagger.tags = ['Characters']
    #swagger.description = 'Updates a character\'s details. Only the owner can update it.'
    #swagger.security = [{ "BearerAuth": [] }]
    #swagger.parameters['id'] = {
        in: 'path',
        description: 'Character ID',
        required: true,
        type: 'string'
    }
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Character details to update',
        required: true,
        schema: {
            name: 'string',
            age: 0,
            gender: 'string',
            race: 'string',
            nickname: 'string',
            appearance: {
                height: 0,
                weight: 0,
                eyeColor: 'string',
                hairColor: 'string',
                clothingStyle: 'string'
            },
            personality: {
                traits: ['string'],
                strengths: ['string'],
                weaknesses: ['string'],
                quirks: ['string']
            },
            history: {
                birthplace: 'string',
                events: [{ year: 0, description: 'string' }]
            },
            relationships: {
                family: ['string'],
                friends: ['string'],
                enemies: ['string'],
                allies: ['string'],
                romance: ['string']
            },
            abilities: ['string'],
            coreRank: 'string'
        }
    }
    #swagger.responses[200] = {
        description: 'Character updated successfully',
        schema: { $ref: "#/definitions/Character" }
    }
    #swagger.responses[400] = {
        description: 'Invalid character ID or bad request'
    }
    #swagger.responses[403] = {
        description: 'Forbidden - User does not have permission'
    }
    #swagger.responses[404] = {
        description: 'Character not found'
    }
  */
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid character ID" });
    }

    const character = await Character.findById(id);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (character.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not have permission to update this character" });
    }

    const updatedCharacter = await Character.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedCharacter);
  } catch (error) {
    res.status(400).json({ message: "Error updating character", error: error.message});
  }
});

module.exports = router;



// DELETE 
router.delete("/:id", authMiddleware, async (req, res) => {
  /**  DELETE - Remove a character by ID
   #swagger.tags = ['Characters']
   #swagger.description = 'Deletes a character by its ID. Only the owner of the character can delete it.'
   #swagger.security = [{ "BearerAuth": [] }]
   #swagger.parameters['id'] = {
       in: 'path',
       description: 'Character ID',
       required: true,
       type: 'string'
   }
   #swagger.responses[200] = {
       description: 'Character deleted successfully',
       schema: { message: "Character deleted successfully" }
   }
   #swagger.responses[400] = {
       description: 'Invalid character ID'
   }
   #swagger.responses[403] = {
       description: 'Forbidden - User does not have permission'
   }
   #swagger.responses[404] = {
       description: 'Character not found'
   }
   #swagger.responses[500] = {
       description: 'Error deleting character'
   }
  */
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid character ID" });
    }

    const character = await Character.findById(id);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    if (character.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not have permission to delete this character" });
    }

    await Character.findByIdAndDelete(id);
    res.json({ message: "Character deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting character", error: error.message });
  }
});

module.exports = router;
