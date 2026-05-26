const Animal = require("../models/Animal");
const ProduccionLeche = require("../models/ProduccionLeche");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/http");
const { ensureNumberInRange } = require("../utils/numberValidation");
const { isFutureDate, normalizeDayRange } = require("../utils/date");
const {
  PRODUCCION_LECHE_L_DIA,
  PRECIO_LECHE_POR_LITRO,
  COSTO_TOTAL_PERIODO,
} = require("../constants/validationRanges");

const buildDateFilter = ({ fechaInicio, fechaFin, required = false }) => {
  if ((!fechaInicio && fechaFin) || (fechaInicio && !fechaFin)) {
    throw new AppError(
      "Debe ingresar un rango de fechas completo",
      400,
      "VALIDATION_ERROR"
    );
  }

  if (!fechaInicio && !fechaFin) {
    if (required) {
      throw new AppError(
        "Debe ingresar el periodo a analizar",
        400,
        "VALIDATION_ERROR"
      );
    }

    return {};
  }

  if (isFutureDate(fechaInicio) || isFutureDate(fechaFin)) {
    throw new AppError(
      "Las fechas del análisis no pueden ser futuras",
      400,
      "VALIDATION_ERROR"
    );
  }

  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError("Las fechas ingresadas no son válidas", 400, "VALIDATION_ERROR");
  }

  if (start > end) {
    throw new AppError(
      "La fecha inicial no puede ser mayor a la fecha final",
      400,
      "VALIDATION_ERROR"
    );
  }

  const { start: normalizedStart } = normalizeDayRange(start);
  const { end: normalizedEnd } = normalizeDayRange(end);

  return {
    fechaRegistro: {
      $gte: normalizedStart,
      $lte: normalizedEnd,
    },
  };
};

const createRegistroProduccion = asyncHandler(async (req, res) => {
  const animalId = req.body.animalId;
  const fechaRegistro = req.body.fechaRegistro;
  const observaciones = req.body.observaciones?.trim();

  if (!animalId || !fechaRegistro) {
    throw new AppError("Campos obligatorios incompletos", 400, "VALIDATION_ERROR");
  }

  const litrosLeche = ensureNumberInRange({
    value: req.body.litrosLeche,
    field: "litrosLeche",
    label: "La producción de leche",
    min: PRODUCCION_LECHE_L_DIA.min,
    max: PRODUCCION_LECHE_L_DIA.max,
    required: true,
  });

  if (isFutureDate(fechaRegistro)) {
    throw new AppError("La fecha de registro no puede ser futura", 400, "VALIDATION_ERROR");
  }

  const animal = await Animal.findById(animalId);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  if (animal.estado !== "activo") {
    throw new AppError(
      "Solo se puede registrar producción para animales activos",
      400,
      "BUSINESS_RULE_ERROR"
    );
  }

  if (animal.sexo !== "hembra") {
    throw new AppError(
      "Solo se puede registrar producción diaria para vacas",
      400,
      "BUSINESS_RULE_ERROR"
    );
  }

  // Regla: solo se puede registrar producción para vacas que sean madres de al menos una cría
  const tieneCria = await Animal.exists({ madreId: animal._id });
  if (!tieneCria) {
    throw new AppError(
      "Solo se puede registrar producción de leche para vacas que son madres de al menos una cría registrada",
      400,
      "BUSINESS_RULE_ERROR"
    );
  }

  const { start, end } = normalizeDayRange(fechaRegistro);
  const existing = await ProduccionLeche.findOne({
    animalId,
    fechaRegistro: { $gte: start, $lte: end },
  });

  if (existing) {
    throw new AppError(
      "Ya existe un registro de producción para esta vaca en la fecha indicada",
      400,
      "BUSINESS_RULE_ERROR"
    );
  }

  const registro = await ProduccionLeche.create({
    animalId,
    litrosLeche,
    observaciones,
    fechaRegistro,
  });

  return sendSuccess(res, 201, {
    message: "Producción diaria registrada exitosamente",
    data: {
      ...registro.toObject(),
      animal: {
        identificacion: animal.identificacion,
        nombre: animal.nombre,
      },
    },
  });
});

const listAnimalesMasProductivos = asyncHandler(async (req, res) => {
  const dateFilter = buildDateFilter({
    fechaInicio: req.query.fechaInicio,
    fechaFin: req.query.fechaFin,
  });
  const limit = Math.min(20, Math.max(2, Number(req.query.limit) || 10));

  const resultados = await ProduccionLeche.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$animalId",
        totalLitros: { $sum: "$litrosLeche" },
        promedioLitros: { $avg: "$litrosLeche" },
        cantidadRegistros: { $sum: 1 },
        ultimaFechaRegistro: { $max: "$fechaRegistro" },
      },
    },
    {
      $lookup: {
        from: "animals",
        localField: "_id",
        foreignField: "_id",
        as: "animal",
      },
    },
    { $unwind: "$animal" },
    {
      $project: {
        _id: 0,
        animalId: "$animal._id",
        identificacion: "$animal.identificacion",
        nombre: "$animal.nombre",
        totalLitros: { $round: ["$totalLitros", 2] },
        promedioLitros: { $round: ["$promedioLitros", 2] },
        cantidadRegistros: 1,
        ultimaFechaRegistro: 1,
      },
    },
    {
      $sort: {
        totalLitros: -1,
        ultimaFechaRegistro: -1,
        identificacion: 1,
      },
    },
    { $limit: limit },
  ]);

  if (resultados.length < 2) {
    return sendSuccess(res, 200, {
      message: "No hay información disponible para comparar animales productivos",
      data: [],
    });
  }

  return sendSuccess(res, 200, {
    data: resultados,
    meta: {
      criterioOrden: ["totalLitros desc", "ultimaFechaRegistro desc", "identificacion asc"],
      periodo: {
        fechaInicio: req.query.fechaInicio || null,
        fechaFin: req.query.fechaFin || null,
      },
    },
  });
});

const analizarRentabilidad = asyncHandler(async (req, res) => {
  const dateFilter = buildDateFilter({
    fechaInicio: req.body.fechaInicio,
    fechaFin: req.body.fechaFin,
    required: true,
  });

  const precioPorLitro = ensureNumberInRange({
    value: req.body.precioPorLitro,
    field: "precioPorLitro",
    label: "El precio por litro",
    min: PRECIO_LECHE_POR_LITRO.min,
    max: PRECIO_LECHE_POR_LITRO.max,
    required: true,
  });

  const costoTotal = ensureNumberInRange({
    value: req.body.costoTotal,
    field: "costoTotal",
    label: "El costo total del periodo",
    min: COSTO_TOTAL_PERIODO.min,
    max: COSTO_TOTAL_PERIODO.max,
    required: true,
  });

  const [resumen] = await ProduccionLeche.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalLitros: { $sum: "$litrosLeche" },
        cantidadRegistros: { $sum: 1 },
        animales: { $addToSet: "$animalId" },
      },
    },
  ]);

  const totalLitros = resumen ? Number(resumen.totalLitros.toFixed(2)) : 0;
  const animalesEnProduccion = resumen ? resumen.animales.length : 0;
  const cantidadRegistros = resumen ? resumen.cantidadRegistros : 0;
  const ingresoBruto = Number((totalLitros * precioPorLitro).toFixed(2));
  const utilidadNeta = Number((ingresoBruto - costoTotal).toFixed(2));
  const margenRentabilidad = ingresoBruto === 0
    ? 0
    : Number(((utilidadNeta / ingresoBruto) * 100).toFixed(2));
  const costoPorLitro = totalLitros === 0 ? 0 : Number((costoTotal / totalLitros).toFixed(2));
  const ingresoPromedioPorAnimal = animalesEnProduccion === 0
    ? 0
    : Number((ingresoBruto / animalesEnProduccion).toFixed(2));

  return sendSuccess(res, 200, {
    data: {
      periodo: {
        fechaInicio: req.body.fechaInicio,
        fechaFin: req.body.fechaFin,
      },
      totalLitros,
      cantidadRegistros,
      animalesEnProduccion,
      precioPorLitro,
      costoTotal,
      ingresoBruto,
      utilidadNeta,
      margenRentabilidad,
      costoPorLitro,
      ingresoPromedioPorAnimal,
      unidades: {
        totalLitros: "L",
        precioPorLitro: "COP/L",
        costoTotal: "COP",
        ingresoBruto: "COP",
        utilidadNeta: "COP",
        margenRentabilidad: "%",
        costoPorLitro: "COP/L",
        ingresoPromedioPorAnimal: "COP/animal",
      },
    },
  });
});

module.exports = {
  createRegistroProduccion,
  listAnimalesMasProductivos,
  analizarRentabilidad,
};