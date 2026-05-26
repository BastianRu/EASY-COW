const Animal = require("../models/Animal");
const ActualizacionMensual = require("../models/ActualizacionMensual");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess, parsePagination, buildPaginationMeta } = require("../utils/http");
const { isFutureDate, normalizeDayRange } = require("../utils/date");
const { ensureNumberInRange } = require("../utils/numberValidation");
const {
  PESO_KG,
  ALTURA_CM,
  CONDICION_CORPORAL,
  PRODUCCION_LECHE_L_DIA,
} = require("../constants/validationRanges");

const createAnimal = asyncHandler(async (req, res) => {
  const esCria = req.body.esCria === true || req.body.esCria === "true";
  const madreIdRaw = req.body.madreId?.trim?.() || req.body.madreId || null;

  const payload = {
    identificacion: req.body.identificacion?.trim(),
    nombre: req.body.nombre?.trim(),
    raza: req.body.raza,
    sexo: req.body.sexo,
    fechaNacimiento: req.body.fechaNacimiento,
    peso: req.body.peso,
    color: req.body.color?.trim(),
    procedencia: req.body.procedencia?.trim(),
    observaciones: req.body.observaciones?.trim(),
    esCria,
    madreId: null,
  };

  if (!payload.identificacion || !payload.raza || !payload.sexo || !payload.fechaNacimiento) {
    throw new AppError("Campos obligatorios incompletos", 400, "VALIDATION_ERROR");
  }

  payload.peso = ensureNumberInRange({
    value: payload.peso,
    field: "peso",
    label: "El peso",
    min: PESO_KG.min,
    max: PESO_KG.max,
    required: true,
  });

  if (isFutureDate(payload.fechaNacimiento)) {
    throw new AppError("La fecha de nacimiento no puede ser futura", 400, "VALIDATION_ERROR");
  }

  if (esCria) {
    if (!madreIdRaw) {
      throw new AppError("Debe indicar la madre de la cría", 400, "VALIDATION_ERROR");
    }
    const madre = await Animal.findById(madreIdRaw).catch(() => null);
    if (!madre) {
      throw new AppError("La madre indicada no existe en el sistema", 400, "VALIDATION_ERROR");
    }
    if (madre.sexo !== "hembra") {
      throw new AppError("El animal seleccionado como madre debe ser hembra", 400, "VALIDATION_ERROR");
    }

    // Regla: la madre debe tener al menos 15 meses más que la cría
    const fechaMadre = new Date(madre.fechaNacimiento);
    const fechaCria = new Date(payload.fechaNacimiento);
    const minFechaCria = new Date(fechaMadre);
    minFechaCria.setMonth(minFechaCria.getMonth() + 15);
    if (fechaCria < minFechaCria) {
      throw new AppError(
        "La madre debe tener al menos 15 meses más que la cría",
        400,
        "BUSINESS_RULE_ERROR"
      );
    }

    // Regla: máximo 2 crías por vaca en un plazo de 10 meses
    const ventanaInicio = new Date(fechaCria);
    ventanaInicio.setMonth(ventanaInicio.getMonth() - 10);
    const criasEnVentana = await Animal.countDocuments({
      madreId: madre._id,
      fechaNacimiento: { $gte: ventanaInicio, $lte: fechaCria },
    });
    if (criasEnVentana >= 2) {
      throw new AppError(
        "La madre ya tiene 2 crías registradas en un plazo de 10 meses",
        400,
        "BUSINESS_RULE_ERROR"
      );
    }

    payload.madreId = madre._id;
  }

  const exists = await Animal.findOne({ identificacion: payload.identificacion });
  if (exists) {
    throw new AppError("Error de validación", 400, "VALIDATION_ERROR", [
      { field: "identificacion", message: "La identificación ya existe" },
    ]);
  }

  const animal = await Animal.create(payload);

  return sendSuccess(res, 201, {
    message: "Animal registrado exitosamente",
    data: animal,
  });
});

const listAnimales = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { estado, raza, sexo, search } = req.query;

  const filter = {};
  if (estado) filter.estado = estado;
  if (raza) filter.raza = raza;
  if (sexo) filter.sexo = sexo;

  if (search) {
    const pattern = new RegExp(search, "i");
    filter.$or = [{ identificacion: pattern }, { nombre: pattern }];
  }

  const [data, total] = await Promise.all([
    Animal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Animal.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    data,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

const getAnimalById = asyncHandler(async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  return sendSuccess(res, 200, { data: animal });
});

const createActualizacionMensual = asyncHandler(async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  if (animal.estado !== "activo") {
    throw new AppError("No se puede actualizar un animal vendido o muerto", 400, "BUSINESS_RULE_ERROR");
  }

  const peso = ensureNumberInRange({
    value: req.body.peso,
    field: "peso",
    label: "El peso",
    min: PESO_KG.min,
    max: PESO_KG.max,
    required: true,
  });

  const altura = ensureNumberInRange({
    value: req.body.altura,
    field: "altura",
    label: "La altura",
    min: ALTURA_CM.min,
    max: ALTURA_CM.max,
    allowNull: true,
  });

  const condicionCorporal = ensureNumberInRange({
    value: req.body.condicionCorporal,
    field: "condicionCorporal",
    label: "La condición corporal",
    min: CONDICION_CORPORAL.min,
    max: CONDICION_CORPORAL.max,
    allowNull: true,
  });

  const produccionLeche = ensureNumberInRange({
    value: req.body.produccionLeche,
    field: "produccionLeche",
    label: "La producción de leche",
    min: PRODUCCION_LECHE_L_DIA.min,
    max: PRODUCCION_LECHE_L_DIA.max,
    allowNull: true,
  });

  const fechaRegistro = req.body.fechaRegistro || new Date();
  if (isFutureDate(fechaRegistro)) {
    throw new AppError("La fecha de registro no puede ser futura", 400, "VALIDATION_ERROR");
  }

  const { start, end } = normalizeDayRange(fechaRegistro);
  const existing = await ActualizacionMensual.findOne({
    animalId: animal._id,
    fechaRegistro: { $gte: start, $lte: end },
  });

  if (existing) {
    throw new AppError("Ya existe una actualización para este animal en la fecha indicada", 400, "BUSINESS_RULE_ERROR");
  }

  const actualizacion = await ActualizacionMensual.create({
    animalId: animal._id,
    peso,
    altura,
    condicionCorporal,
    produccionLeche,
    estadoReproductivo: req.body.estadoReproductivo,
    observaciones: req.body.observaciones?.trim(),
    fechaRegistro,
  });

  return sendSuccess(res, 201, {
    message: "Actualización registrada exitosamente",
    data: {
      ...actualizacion.toObject(),
      animal: {
        identificacion: animal.identificacion,
        nombre: animal.nombre,
      },
    },
  });
});

const listActualizaciones = asyncHandler(async (req, res) => {
  const animal = await Animal.findById(req.params.id);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  const data = await ActualizacionMensual.find({ animalId: animal._id }).sort({ fechaRegistro: -1 });

  return sendSuccess(res, 200, { data });
});

module.exports = {
  createAnimal,
  listAnimales,
  getAnimalById,
  createActualizacionMensual,
  listActualizaciones,
};
