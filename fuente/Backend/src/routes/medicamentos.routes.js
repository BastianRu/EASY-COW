const { Router } = require("express");
const { createMedicamento, listMedicamentos } = require("../controllers/medicamentos.controller");

const router = Router();

router.post("/", createMedicamento);
router.get("/", listMedicamentos);

module.exports = router;
