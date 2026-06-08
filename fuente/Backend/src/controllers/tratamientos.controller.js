const Animal = require("../models/Animal");
const RegistroEnfermedad = require("../models/RegistroEnfermedad");
const Tratamiento = require("../models/Tratamiento");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess, parsePagination, buildPaginationMeta } = require("../utils/http");
const { isFutureDate, normalizeDayRange } = require("../utils/date");
const { ensureNumberInRange } = require("../utils/numberValidation");
const { DURACION_TRATAMIENTO_DIAS } = require("../constants/validationRanges");

const createTratamiento = asyncHandler(async (req, res) => {
  const {
    animalId,
    registroEnfermedadId,
    fechaInicio,
    medicamento,
    dosis,
    frecuencia,
    duracion,
    viaAdministracion,
    veterinario,
    estadoTratamiento,
    observaciones,
  } = req.body;

  if (!animalId || !fechaInicio || !medicamento?.trim() || !dosis?.trim() || !frecuencia || !duracion || !viaAdministracion) {
    throw new AppError("Campos obligatorios incompletos", 400, "VALIDATION_ERROR");
  }

  const duracionValidada = ensureNumberInRange({
    value: duracion,
    field: "duracion",
    label: "La duración",
    min: DURACION_TRATAMIENTO_DIAS.min,
    max: DURACION_TRATAMIENTO_DIAS.max,
    required: true,
    integer: true,
  });

  if (isFutureDate(fechaInicio)) {
    throw new AppError("La fecha de inicio no puede ser futura", 400, "VALIDATION_ERROR");
  }

  const animal = await Animal.findById(animalId);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  // Verificar duplicado: mismo animal + mismo medicamento (sin distinción de mayúsculas) + misma fecha
  const { start, end } = normalizeDayRange(fechaInicio);
  const duplicado = await Tratamiento.findOne({
    animalId: animal._id,
    medicamento: { $regex: new RegExp(`^${medicamento.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    fechaInicio: { $gte: start, $lte: end },
  });
  if (duplicado) {
    throw new AppError(
      "Ya existe un tratamiento con el mismo medicamento registrado para este animal en la misma fecha",
      400,
      "BUSINESS_RULE_ERROR"
    );
  }
  if (registroEnfermedadId) {
    registro = await RegistroEnfermedad.findById(registroEnfermedadId);
    if (!registro || String(registro.animalId) !== String(animal._id)) {
      throw new AppError("El registro de enfermedad no es válido para este animal", 400, "BUSINESS_RULE_ERROR");
    }
  } else {
    registro = await RegistroEnfermedad.findOne({ animalId: animal._id, estadoActual: "activo" }).sort({ createdAt: -1 });
    if (!registro) {
      throw new AppError("El tratamiento requiere un registro de enfermedad activo", 400, "BUSINESS_RULE_ERROR");
    }
  }

  const tratamiento = await Tratamiento.create({
    animalId,
    registroEnfermedadId: registro._id,
    fechaInicio,
    medicamento: medicamento.trim(),
    dosis: dosis.trim(),
    frecuencia,
    duracion: duracionValidada,
    viaAdministracion,
    veterinario: veterinario?.trim(),
    estadoTratamiento,
    observaciones: observaciones?.trim(),
  });

  return sendSuccess(res, 201, {
    message: "Tratamiento registrado exitosamente",
    data: {
      ...tratamiento.toObject(),
      animal: {
        identificacion: animal.identificacion,
        nombre: animal.nombre,
      },
    },
  });
});

const updateTratamiento = asyncHandler(async (req, res) => {
  const updateData = {};
  if (req.body.estadoTratamiento) updateData.estadoTratamiento = req.body.estadoTratamiento;
  if (req.body.observaciones !== undefined) updateData.observaciones = req.body.observaciones?.trim();

  const tratamiento = await Tratamiento.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!tratamiento) {
    throw new AppError("Tratamiento no encontrado", 404, "NOT_FOUND");
  }

  return sendSuccess(res, 200, {
    message: "Tratamiento actualizado exitosamente",
    data: tratamiento,
  });
});

const listTratamientos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { estadoTratamiento, animalId } = req.query;

  const filter = {};
  if (estadoTratamiento) filter.estadoTratamiento = estadoTratamiento;
  if (animalId) filter.animalId = animalId;

  const [data, total] = await Promise.all([
    Tratamiento.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("animalId", "identificacion nombre")
      .populate("registroEnfermedadId", "enfermedad"),
    Tratamiento.countDocuments(filter),
  ]);

  const mapped = data.map((item) => ({
    id: item._id,
    fechaInicio: item.fechaInicio,
    medicamento: item.medicamento,
    dosis: item.dosis,
    frecuencia: item.frecuencia,
    duracion: item.duracion,
    viaAdministracion: item.viaAdministracion,
    veterinario: item.veterinario,
    estadoTratamiento: item.estadoTratamiento,
    observaciones: item.observaciones,
    animal: item.animalId
      ? {
          id: item.animalId._id,
          identificacion: item.animalId.identificacion,
          nombre: item.animalId.nombre,
          enfermedad: item.registroEnfermedadId?.enfermedad || null,
        }
      : null,
  }));

  return sendSuccess(res, 200, {
    data: mapped,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

module.exports = {
  createTratamiento,
  updateTratamiento,
  listTratamientos,
};
