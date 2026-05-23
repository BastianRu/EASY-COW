const Animal = require("../models/Animal");
const Venta = require("../models/Venta");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess, parsePagination, buildPaginationMeta } = require("../utils/http");
const { isFutureDate } = require("../utils/date");
const VALIDATION_RANGES = require("../constants/validationRanges");

const createVenta = asyncHandler(async (req, res) => {
  const { animalId, fechaVenta, comprador, precioVenta, formaPago, observaciones } = req.body;

  if (!animalId || !fechaVenta || !comprador?.trim() || precioVenta === undefined || !formaPago) {
    throw new AppError("Campos obligatorios incompletos", 400, "VALIDATION_ERROR");
  }

  if (isFutureDate(fechaVenta)) {
    throw new AppError("La fecha de venta no puede ser futura", 400, "VALIDATION_ERROR");
  }

  const precio = Number(precioVenta);
  if (
    !Number.isFinite(precio) ||
    precio < VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min ||
    precio > VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max
  ) {
    throw new AppError(
      `El precio de venta debe estar entre ${VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min} y ${VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max}`,
      400,
      "VALIDATION_ERROR"
    );
  }

  const animal = await Animal.findById(animalId);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  if (animal.estado !== "activo") {
    throw new AppError(
      "Solo se pueden vender animales con estado activo",
      400,
      "BUSINESS_RULE_ERROR"
    );
  }

  const [venta] = await Promise.all([
    Venta.create({
      animalId,
      fechaVenta,
      comprador: comprador.trim(),
      precioVenta: precio,
      formaPago,
      observaciones: observaciones?.trim() || null,
    }),
    Animal.findByIdAndUpdate(animalId, { estado: "vendido" }),
  ]);

  return sendSuccess(res, 201, {
    message: "Venta registrada exitosamente",
    data: {
      ...venta.toObject(),
      animal: {
        identificacion: animal.identificacion,
        nombre: animal.nombre,
      },
    },
  });
});

const listVentas = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { animalId, fechaInicio, fechaFin } = req.query;

  const filter = {};
  if (animalId) filter.animalId = animalId;
  if (fechaInicio || fechaFin) {
    filter.fechaVenta = {};
    if (fechaInicio) filter.fechaVenta.$gte = new Date(fechaInicio);
    if (fechaFin) filter.fechaVenta.$lte = new Date(fechaFin + "T23:59:59");
  }

  const [data, total] = await Promise.all([
    Venta.find(filter)
      .sort({ fechaVenta: -1 })
      .skip(skip)
      .limit(limit)
      .populate("animalId", "identificacion nombre raza"),
    Venta.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    data,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

module.exports = { createVenta, listVentas };
