require("dotenv").config();
const mongoose = require("mongoose");
const Character = require("./models/Character");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedCharacters = [
  {
    name: "Drake",
    age: 35,
    gender: "Male",
    race: "Dragontine",
    nickname: "Drake",
    appearance: {
      height: 1.6,
      weight: 60,
      eyeColor: "Gold",
      hairColor: "White",
      clothingStyle: "Warrior Style",
    },
    personality: {
      traits: ["Dragontine"],
      strengths: ["Intelligence"],
      weaknesses: ["His mind"],
      quirks: ["A 40 years old man"],
    },
    history: {
      birthplace: "Alister Kingdom",
      events: [
        { year: 215, description: "Born in the desert" },
      ],
    },
    relationships: {
      family: [],
      friends: [],
      enemies: [],
      allies: [],
      romance: [],
    },
    abilities: [""],
    coreRank: "Expert",
  },
];

const seedDB = async () => {
  try {
    await Character.deleteMany({});
    await Character.insertMany(seedCharacters);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
  }
};

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB, seeding database...");
  seedDB();
});
