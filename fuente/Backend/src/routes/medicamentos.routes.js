const { Router } = require("express");
const { createMedicamento, listMedicamentos, updateStock } = require("../controllers/medicamentos.controller");

const router = Router();

router.post("/", createMedicamento);
router.get("/", listMedicamentos);
router.patch("/:id/stock", updateStock);

module.exports = router;
