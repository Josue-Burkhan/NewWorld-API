require("dotenv").config();
const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
require("./auth/passport");

const abilityRoutes = require("./routes/abilities-routes.js");
const characterRoutes = require("./routes/characters-routes.js");
//const eventRoutes = require("./routes/events-routes.js");
//const factionRoutes = require("./routes/factions-routes.js");
//const itemRoutes = require("./routes/items-routes.js");
//const magicalObjectRoutes = require("./routes/magicalObjects-routes.js");
//const placeRoutes = require("./routes/places-routes.js");
//const speciesRoutes = require("./routes/species-routes.js");

const authRoutes = require("./routes/auth-routes");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";


// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use((req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});


app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());


//docs
const swaggerOptions = {
  swaggerOptions: {
    authAction: {
      BearerAuth: {
        name: "Authorization",
        schema: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "Enter your token in the format: Bearer <token>",
        },
        value: "",
      },
    },
  },
};

app.use(
  "/api-newworld-docs",
  swaggerUi.serve,
  (req, res, next) => {
    if (req.query.token) {
      swaggerOptions.swaggerOptions.authAction.BearerAuth.value = `Bearer ${req.query.token}`;
    }
    swaggerUi.setup(swaggerDocument, swaggerOptions)(req, res, next);
  }
);


// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


//Routes
app.use("/api/newworld/abilities", abilityRoutes);
app.use("/api/newworld/characters", characterRoutes);
//app.use("/api/newworld/events", eventRoutes);
//app.use("/api/newworld/factions", factionRoutes);
//app.use("/api/newworld/items", itemRoutes);
//app.use("/api/newworld/magical-objects", magicalObjectRoutes);
//app.use("/api/newworld/places", placeRoutes);
//app.use("/api/newworld/species", speciesRoutes);

app.use("/auth", authRoutes);

//Star the server
app.listen(PORT, () => {
  console.log(`Your API is running on: http://${HOST}:${PORT}/api-newworld-docs`);
});
