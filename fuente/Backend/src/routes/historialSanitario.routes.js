const { Router } = require("express");
const { getHistorial } = require("../controllers/historialSanitario.controller");

const router = Router();

router.get("/", getHistorial);

module.exports = router;
