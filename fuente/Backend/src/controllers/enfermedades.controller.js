const Animal = require("../models/Animal");
const RegistroEnfermedad = require("../models/RegistroEnfermedad");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess, parsePagination, buildPaginationMeta } = require("../utils/http");
const { isFutureDate } = require("../utils/date");
const { ensureNumberInRange } = require("../utils/numberValidation");
const { TEMPERATURA_C } = require("../constants/validationRanges");

const createEnfermedad = asyncHandler(async (req, res) => {
  const { animalId, fechaDeteccion, enfermedad, sintomas, temperatura, estadoGeneral, observaciones } = req.body;

  if (!animalId || !fechaDeteccion || !enfermedad || !sintomas?.trim()) {
    throw new AppError("Campos obligatorios incompletos", 400, "VALIDATION_ERROR");
  }

  if (isFutureDate(fechaDeteccion)) {
    throw new AppError("La fecha de detección no puede ser futura", 400, "VALIDATION_ERROR");
  }

  const temperaturaValidada = ensureNumberInRange({
    value: temperatura,
    field: "temperatura",
    label: "La temperatura",
    min: TEMPERATURA_C.min,
    max: TEMPERATURA_C.max,
    allowNull: true,
  });

  const animal = await Animal.findById(animalId);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  const registro = await RegistroEnfermedad.create({
    animalId,
    fechaDeteccion,
    enfermedad,
    sintomas: sintomas.trim(),
    temperatura: temperaturaValidada,
    estadoGeneral,
    observaciones: observaciones?.trim(),
  });

  return sendSuccess(res, 201, {
    message: "Registro de enfermedad exitoso",
    data: {
      ...registro.toObject(),
      animal: {
        identificacion: animal.identificacion,
        nombre: animal.nombre,
      },
    },
  });
});

const listEnfermedades = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { estadoActual, enfermedad, animalId } = req.query;

  const filter = {};
  if (estadoActual) filter.estadoActual = estadoActual;
  if (enfermedad) filter.enfermedad = enfermedad;
  if (animalId) filter.animalId = animalId;

  const [data, total] = await Promise.all([
    RegistroEnfermedad.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("animalId", "identificacion nombre raza"),
    RegistroEnfermedad.countDocuments(filter),
  ]);

  const mapped = data.map((item) => ({
    id: item._id,
    fechaDeteccion: item.fechaDeteccion,
    enfermedad: item.enfermedad,
    sintomas: item.sintomas,
    temperatura: item.temperatura,
    estadoGeneral: item.estadoGeneral,
    estadoActual: item.estadoActual,
    observaciones: item.observaciones,
    animal: item.animalId
      ? {
          id: item.animalId._id,
          identificacion: item.animalId.identificacion,
          nombre: item.animalId.nombre,
          raza: item.animalId.raza,
        }
      : null,
  }));

  return sendSuccess(res, 200, {
    data: mapped,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

module.exports = {
  createEnfermedad,
  listEnfermedades,
};