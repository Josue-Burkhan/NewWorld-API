const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();


router.get("/google", (req, res, next) => {
  const redirect = req.query.redirect || "/new-world/dashboard/";
  req.session.redirectTo = redirect;
  next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: "3h" });

    const redirectPath = req.session.redirectTo || "/new-world/dashboard/";

    const redirectUrl = `https://writers.wild-fantasy.com${redirectPath}?token=${token}`;

    res.redirect(redirectUrl);
  }
);

module.exports = router;
