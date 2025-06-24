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
const userRoutes = require("./routes/user-routes.js");
const worldRoutes = require("./routes/worlds");
const searchRoutes = require("./routes/searchRoutes.js");

const abilityRoutes = require("./routes/abilities-routes.js");
const characterRoutes = require("./routes/characters-routes.js");
const itemRoutes = require("./routes/items-routes.js");
const locationRoutes = require("./routes/locations-routes.js");
const eventRoutes = require("./routes/events-routes.js");
const factionRoutes = require("./routes/factions-routes.js");
const technologyRoutes = require("./routes/technologies-routes.js");
const languageRoutes = require("./routes/languages-routes.js");
const powerSystemRoutes = require("./routes/powersystems-routes.js");
const creatureRoutes = require("./routes/creatures-routes.js");
const religionRoutes = require("./routes/religions-routes.js");
const storyRoutes = require("./routes/stories-routes.js");
const raceRoutes = require("./routes/races-routes.js");
const economyRoutes = require("./routes/economies-routes.js");

const authRoutes = require("./routes/auth-routes");
const paypalRoutes = require("./routes/paypal.js")

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";


// Middleware
app.use(express.json());

app.use(cors({
  origin: "https://writers.wild-fantasy.com",
  credentials: true
}));

app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.use((req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 3
  }
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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


//Routes

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

app.use("/api/account", userRoutes);
app.use("/api/worlds", worldRoutes);
app.use("/api/search", searchRoutes);

app.use("/api/newworld/abilities", abilityRoutes);
app.use("/api/newworld/characters", characterRoutes);
app.use("/api/newworld/items", itemRoutes);
app.use("/api/newworld/locations", locationRoutes);
app.use("/api/newworld/events", eventRoutes);
app.use("/api/newworld/factions", factionRoutes);
app.use("/api/newworld/technologies", technologyRoutes);
app.use("/api/newworld/languages", languageRoutes);
app.use("/api/newworld/powersystems", powerSystemRoutes);
app.use("/api/newworld/creatures", creatureRoutes);
app.use("/api/newworld/religions", religionRoutes);
app.use("/api/newworld/stories", storyRoutes);
app.use("/api/newworld/races", raceRoutes);
app.use("/api/newworld/economies", economyRoutes);

app.use("/auth", authRoutes);
app.use("/paypal", paypalRoutes);

//Star the server
app.listen(PORT, () => {
  console.log(`Your API is running on: http://${HOST}:${PORT}/api-newworld-docs`);
});
