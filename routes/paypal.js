const express = require("express");
const axios = require("axios");
const { upgradePlan } = require("../services/userServices");
const User = require("../models/user-model");

const router = express.Router();

// Middleware JWT (copiado desde tu archivo user.js)
const jwt = require("jsonwebtoken");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

// POST /api/paypal/subscribe
router.post("/subscribe", authenticateToken, async (req, res) => {
    const { subscriptionId, plan, planType } = req.body;

    try {
        const basicAuth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");

        // Llama a PayPal para verificar la suscripción
        const response = await axios.get(`https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionId}`, {
            headers: {
                'Authorization': `Basic ${basicAuth}`
            }
        });

        const paypalData = response.data;

        if (paypalData.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Subscription is not active.' });
        }

        await upgradePlan(req.user.userId, plan, planType);
        res.json({ message: "Plan actualizado correctamente." });

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Error al verificar la suscripción con PayPal." });
    }
});

module.exports = router;
