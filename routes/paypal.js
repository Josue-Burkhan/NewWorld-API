const express = require("express");
const axios = require("axios");
const { upgradePlan } = require("../services/userServices");
const User = require("../models/user-model");
const jwt = require("jsonwebtoken");

const router = express.Router();
const PAYPAL_API_BASE = "https://api-m.paypal.com"; // Usa api-m.sandbox.paypal.com para pruebas

// --- Función para obtener el Token de Acceso de PayPal ---
const getPaypalAccessToken = async () => {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
    try {
        const response = await axios.post(`${PAYPAL_API_BASE}/v1/oauth2/token`, "grant_type=client_credentials", {
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return response.data.access_token;
    } catch (error) {
        console.error("Error getting PayPal access token:", error.response?.data || error.message);
        throw new Error("Could not get PayPal access token.");
    }
};

// Middleware de autenticación (el que ya tienes)
const authenticateToken = (req, res, next) => {
    // ... tu código de middleware JWT sin cambios ...
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};


// POST /api/paypal/subscribe  (Tu ruta, ahora corregida)
// Esta ruta VERIFICA una suscripción DESPUÉS de que el usuario la ha pagado.
router.post("/subscribe", authenticateToken, async (req, res) => {
    const { subscriptionId, plan, planType } = req.body;

    if (!subscriptionId || !plan || !planType) {
        return res.status(400).json({ error: "Faltan datos: subscriptionId, plan y planType son requeridos." });
    }

    try {
        const accessToken = await getPaypalAccessToken();

        // Llama a PayPal para verificar la suscripción usando el Bearer Token
        const response = await axios.get(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`, // <-- CORRECCIÓN IMPORTANTE
            },
        });

        const paypalData = response.data;

        if (paypalData.status !== 'ACTIVE') {
            return res.status(400).json({ error: `La suscripción no está activa. Estado: ${paypalData.status}` });
        }

        // Si todo está bien, actualiza el plan del usuario en tu base de datos
        await upgradePlan(req.user.userId, plan, planType);
        res.json({ message: "Plan actualizado correctamente." });

    } catch (err) {
        console.error("Error al verificar la suscripción:", err.response?.data || err.message);
        res.status(500).json({ error: "Error interno al verificar la suscripción con PayPal." });
    }
});


// POST /api/paypal/create-subscription  (Tu ruta, ahora corregida)
router.post("/create-subscription", authenticateToken, async (req, res) => {
    const { planId } = req.body;
    if (!planId) {
        return res.status(400).json({ error: "Falta el ID del plan (planId)." });
    }

    try {
        const accessToken = await getPaypalAccessToken();


        const returnUrl = "https://writers.wild-fantasy.com/thank-you";
        const cancelUrl = "https://writers.wild-fantasy.com/suscription";

        const response = await axios.post(`${PAYPAL_API_BASE}/v1/billing/subscriptions`,
            {
                plan_id: planId,
                application_context: {
                    brand_name: "Wild Fantasy",
                    user_action: "SUBSCRIBE_NOW",
                    return_url: returnUrl,
                    cancel_url: cancelUrl
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const approveUrl = response.data.links.find(link => link.rel === "approve").href;

        res.json({ approveUrl });

    } catch (err) {
        console.error("Error al crear la suscripción en PayPal:", err.response?.data || err.message);
        res.status(500).json({ error: "Error interno al crear la suscripción." });
    }
});

module.exports = router;