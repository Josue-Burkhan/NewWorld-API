const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const autoPopulateRefs = require("../utils/autoPopulateRefs");


router.get("/google", (req, res, next) => {
  const redirect = req.query.redirect || "/new-world/dashboard/";
  req.session.redirectTo = redirect;
  next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign(
      {
        userId: req.user._id,
        email: req.user.email,
        plan: req.user.plan
      },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );    

    const redirectPath = req.session.redirectTo || "/new-world/dashboard/";

    const redirectUrl = `https://gold-spoonbill-789664.hostingersite.com/${redirectPath}?token=${token}`;

    res.redirect(redirectUrl);
  }
);

module.exports = router;
