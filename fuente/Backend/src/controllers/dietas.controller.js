const Animal = require("../models/Animal");
const Dieta = require("../models/Dieta");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess, parsePagination, buildPaginationMeta } = require("../utils/http");
const { isFutureDate } = require("../utils/date");
const { ensureNumberInRange } = require("../utils/numberValidation");
const { CANTIDAD_ALIMENTO_KG_DIA } = require("../constants/validationRanges");

const createDieta = asyncHandler(async (req, res) => {
  const {
    animalId,
    fechaRegistro,
    tipoDieta,
    alimentoBase,
    cantidad,
    suplementos,
    frecuenciaAlimentacion,
    objetivoDieta,
    observaciones,
  } = req.body;

  if (!animalId || !fechaRegistro || !tipoDieta || !alimentoBase?.trim() || cantidad === undefined || !frecuenciaAlimentacion) {
    throw new AppError("Campos obligatorios incompletos", 400, "VALIDATION_ERROR");
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-]+$/.test(alimentoBase.trim())) {
    throw new AppError(
      "El alimento base solo puede contener letras, no números ni caracteres especiales",
      400,
      "VALIDATION_ERROR"
    );
  }

  const cantidadValidada = ensureNumberInRange({
    value: cantidad,
    field: "cantidad",
    label: "La cantidad",
    min: CANTIDAD_ALIMENTO_KG_DIA.min,
    max: CANTIDAD_ALIMENTO_KG_DIA.max,
    required: true,
  });

  if (isFutureDate(fechaRegistro)) {
    throw new AppError("La fecha de registro no puede ser futura", 400, "VALIDATION_ERROR");
  }

  const animal = await Animal.findById(animalId);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  const dieta = await Dieta.create({
    animalId,
    fechaRegistro,
    tipoDieta,
    alimentoBase: alimentoBase.trim(),
    cantidad: cantidadValidada,
    suplementos: suplementos?.trim(),
    frecuenciaAlimentacion,
    objetivoDieta,
    observaciones: observaciones?.trim(),
  });

  return sendSuccess(res, 201, {
    message: "Dieta registrada exitosamente",
    data: {
      ...dieta.toObject(),
      animal: {
        identificacion: animal.identificacion,
        nombre: animal.nombre,
      },
    },
  });
});

const listDietas = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { animalId, tipoDieta, objetivoDieta } = req.query;

  const filter = {};
  if (animalId) filter.animalId = animalId;
  if (tipoDieta) filter.tipoDieta = tipoDieta;
  if (objetivoDieta) filter.objetivoDieta = objetivoDieta;

  const [data, total] = await Promise.all([
    Dieta.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("animalId", "identificacion nombre"),
    Dieta.countDocuments(filter),
  ]);

  const mapped = data.map((item) => ({
    id: item._id,
    fechaRegistro: item.fechaRegistro,
    tipoDieta: item.tipoDieta,
    alimentoBase: item.alimentoBase,
    cantidad: item.cantidad,
    objetivoDieta: item.objetivoDieta,
    animal: item.animalId
      ? {
          id: item.animalId._id,
          identificacion: item.animalId.identificacion,
          nombre: item.animalId.nombre,
        }
      : null,
  }));

  return sendSuccess(res, 200, {
    data: mapped,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

module.exports = {
  createDieta,
  listDietas,
};
