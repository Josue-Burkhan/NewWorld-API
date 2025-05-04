const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Wild Fantasy API",
    description: "API documentation for managing characters, factions, places, species, items, and more in the Wild Fantasy universe. <a href='/auth/google'>Login</a>",
    version: "1.0.1",
  },
  host: "newworld-api.onrender.com",
  basePath: "/",
  schemes: ["https", "http"],
  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter your token in the format: Bearer <token>",
    },
  },
  security: [{ BearerAuth: [] }] 
};

const outputFile = "./docs/swagger.json";
const endpointsFiles = ["./server.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
