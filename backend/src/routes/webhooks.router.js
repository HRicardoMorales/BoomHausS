const express = require("express");
const router = express.Router();

const { mercadopagoWebhook } = require("../controllers/mercadopagoWebhook.controller");

router.post("/mercadopago", mercadopagoWebhook);

module.exports = router;
