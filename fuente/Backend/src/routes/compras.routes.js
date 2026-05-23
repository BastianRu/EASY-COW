const { Router } = require("express");
const { createCompra, listCompras } = require("../controllers/compras.controller");

const router = Router();

router.post("/", createCompra);
router.get("/", listCompras);

module.exports = router;
