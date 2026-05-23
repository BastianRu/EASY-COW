const { Router } = require("express");
const { getReporte } = require("../controllers/reportes.controller");

const router = Router();

router.get("/", getReporte);

module.exports = router;
