const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Ability = require("../models/Ability");
const Character = require("../models/Character");
const authMiddleware = require("../middleware/authMiddleware");

// GET all abilities for the authenticated user
router.get("/", authMiddleware, async (req, res) => {
  /*
    #swagger.tags = ['Abilities']
    #swagger.description = 'Retrieve all abilities associated with the authenticated user.'
    #swagger.security = [{ "BearerAuth": [] }]
    #swagger.responses[200] = { 
      description: 'Successfully retrieved abilities', 
      schema: [{ 
        _id: 'string', 
        name: 'string', 
        type: 'string', 
        description: 'string', 
        elements: [{ element: 'string', orbs: 0 }], 
        charactersWhoUse: ['string'],
        owner: ['string'] 
      }] 
    }
    #swagger.responses[401] = { 
      description: 'Unauthorized - No token provided or invalid', 
      schema: { message: 'No token provided or invalid' } 
    }
    #swagger.responses[500] = { 
      description: 'Server error', 
      schema: { message: 'Error retrieving abilities', error: {} } 
    }
  */
  try {
    const abilities = await Ability.find({ owner: req.user.userId })
      .populate({
        path: "charactersWhoUse",
        select: "name",
        options: { strictPopulate: false }
      });

    res.json(abilities);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving abilities", error });
  }
});

// GET ability by ID (only if user has access)
router.get("/:id", authMiddleware, async (req, res) => {
  /*
    #swagger.tags = ['Abilities']
    #swagger.description = 'Retrieve a specific ability by its ID, only if the authenticated user has access.'
    #swagger.security = [{ "BearerAuth": [] }]
    #swagger.parameters['id'] = { 
      in: 'path', 
      description: 'Ability ID', 
      required: true, 
      type: 'string' 
    }
    #swagger.responses[200] = { 
      description: 'Successfully retrieved ability', 
      schema: { 
        _id: 'string', 
        name: 'string', 
        type: 'string', 
        description: 'string', 
        elements: [{ element: 'string', orbs: 0 }], 
        charactersWhoUse: [{ _id: 'string', name: 'string' }],
        owner: ['string'] 
      } 
    }
    #swagger.responses[403] = { 
      description: 'Forbidden - User does not have access to this ability', 
      schema: { message: "Forbidden - You don't have access to this ability" } 
    }
    #swagger.responses[401] = { 
      description: 'Unauthorized - No token provided or invalid', 
      schema: { message: 'No token provided or invalid' } 
    }
    #swagger.responses[500] = { 
      description: 'Server error', 
      schema: { message: 'Error retrieving ability', error: {} } 
    }
  */
  try {
    console.log("Requested ID:", req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ability ID" });
    }

    const ability = await Ability.findOne({ _id: req.params.id, owner: req.user.userId })
      .populate({
        path: "charactersWhoUse",
        select: "name",
        options: { strictPopulate: false }
      });

    console.log("Retrieved ability:", ability);

    if (!ability) {
      return res.status(404).json({ message: "Ability not found or access denied" });
    }

    res.json(ability);
  } catch (error) {
    console.error("Error retrieving ability:", error);
    res.status(500).json({ message: "Error retrieving ability", error: error.message });
  }
});



// POST - Create a new ability
router.post("/", async (req, res) => {
  /*
     #swagger.tags = ['Abilities']
     #swagger.description = 'Create a new ability associated with the authenticated user.'
     #swagger.security = [{ "BearerAuth": [] }]
     #swagger.parameters['body'] = { 
        in: 'body', 
        description: 'Ability data', 
        required: true, 
        schema: { 
          name: 'string', 
          type: 'string', 
          description: 'string', 
          elements: [{ element: 'string', orbs: 0 }],
          charactersWhoUse: ['string']
        } 
     }
     #swagger.responses[201] = { 
        description: 'Ability created successfully', 
        schema: { 
          _id: 'string', 
          name: 'string', 
          type: 'string', 
          description: 'string', 
          elements: [{ element: 'string', orbs: 0 }], 
          charactersWhoUse: ['string'], 
          owner: ['string'] 
        } 
     }
     #swagger.responses[400] = { 
        description: 'Error creating ability', 
        schema: { message: 'Error creating ability', error: {} } 
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

    const { name, type, description, elements, charactersWhoUse } = req.body;
    if (!name || !type || !description || !Array.isArray(elements)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const formattedElements = elements.map((el) => ({
      element: el.element,
      orbs: Number(el.orbs) || 0,
    }));

    const characterIds = await Character.find({
      _id: { $in: req.body.charactersWhoUse }
    }).distinct("_id");

    const newAbility = new Ability({
      name,
      type,
      description,
      elements: formattedElements,
      charactersWhoUse: characterIds,
      owner: [userId],
    });

    await newAbility.save();
    res.status(201).json(newAbility);
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: "Validation error", error: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
});


// UPDATE ability by ID (only if user has access)
router.put("/:id", authMiddleware, async (req, res) => {
  /*  
    #swagger.tags = ['Abilities']  
    #swagger.description = 'Update an existing ability by ID if the authenticated user has access.'  
    #swagger.security = [{ "BearerAuth": [] }]  
    #swagger.parameters['id'] = { in: 'path', description: 'Ability ID', required: true, type: 'string' }  
    #swagger.parameters['body'] = { 
      in: 'body', 
      description: 'Updated ability data', 
      required: true, 
      schema: { 
        name: 'string', 
        type: 'string', 
        description: 'string', 
        elements: [{ element: 'string', orbs: 0 }], 
        charactersWhoUse: ['ObjectId']
      } 
    }  
    #swagger.responses[200] = { 
      description: 'Ability updated successfully', 
      schema: { 
        _id: 'string', 
        name: 'string', 
        type: 'string', 
        description: 'string', 
        elements: [{ element: 'string', orbs: 0 }], 
        charactersWhoUse: ['string'], 
        owner: ['string']
      } 
    }  
    #swagger.responses[403] = { 
      description: 'Forbidden - User does not have access', 
      schema: { message: 'Forbidden - You do not have permission to update this ability' } 
    }  
    #swagger.responses[404] = { 
      description: 'Ability not found', 
      schema: { message: 'Ability not found' } 
    }  
    #swagger.responses[400] = { 
      description: 'Error updating ability', 
      schema: { message: 'Error updating ability', error: {} } 
    }  
  */
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ability ID" });
    }

    const existingAbility = await Ability.findById(req.params.id);
    if (!existingAbility) {
      return res.status(404).json({ message: "Ability not found" });
    }

    if (existingAbility.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not have permission to update this ability" });
    }

    if (req.body.elements && Array.isArray(req.body.elements)) {
      req.body.elements = req.body.elements.map(el => ({
        element: el.element,
        orbs: Number(el.orbs) || 0
      }));
    }

    let characterIds = [];
    if (req.body.charactersWhoUse && Array.isArray(req.body.charactersWhoUse)) {
      characterIds = req.body.charactersWhoUse.filter(id =>
        mongoose.Types.ObjectId.isValid(id)
      );
    }

    const updatedAbility = await Ability.findByIdAndUpdate(
      req.params.id,
      { ...req.body, charactersWhoUse: characterIds },
      { new: true, runValidators: true }
    );

    res.json(updatedAbility);
  } catch (error) {
    res.status(400).json({ message: "Error updating ability", error: error.message });
  }
});



// DELETE ability by ID (only if user has access)
router.delete("/:id", authMiddleware, async (req, res) => {
  /*  
  #swagger.tags = ['Abilities']  
  #swagger.description = 'Delete an ability by ID if the authenticated user has access.'  
  #swagger.security = [{ "BearerAuth": [] }]  
  #swagger.parameters['id'] = { in: 'path', description: 'Ability ID', required: true, type: 'string' }  
  #swagger.responses[200] = { description: 'Ability deleted successfully', schema: { message: 'Ability deleted successfully' } }  
  #swagger.responses[403] = { description: 'Forbidden - User does not have access', schema: { message: 'Forbidden - You do not have permission to delete this ability' } }  
  #swagger.responses[404] = { description: 'Ability not found', schema: { message: 'Ability not found' } }  
  #swagger.responses[500] = { description: 'Error deleting ability', schema: { message: 'Error deleting ability', error: {} } }  
  */
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ability ID" });
    }

    const ability = await Ability.findById(req.params.id);
    if (!ability) {
      return res.status(404).json({ message: "Ability not found" });
    }

    if (ability.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden - You do not have permission to delete this ability" });
    }

    await Ability.findByIdAndDelete(req.params.id);
    res.json({ message: "Ability deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ability", error: error.message });
  }
});

module.exports = router;

