const { Router } = require("express");
const { createVenta, listVentas } = require("../controllers/ventas.controller");

const router = Router();

router.post("/", createVenta);
router.get("/", listVentas);

module.exports = router;
