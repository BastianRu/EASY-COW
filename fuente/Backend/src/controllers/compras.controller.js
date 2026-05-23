const Animal = require("../models/Animal");
const Compra = require("../models/Compra");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess, parsePagination, buildPaginationMeta } = require("../utils/http");
const { isFutureDate } = require("../utils/date");
const VALIDATION_RANGES = require("../constants/validationRanges");

const createCompra = asyncHandler(async (req, res) => {
  const { animalId, fechaCompra, proveedor, precioCompra, formaPago, observaciones } = req.body;

  if (!animalId || !fechaCompra || !proveedor?.trim() || precioCompra === undefined || !formaPago) {
    throw new AppError("Campos obligatorios incompletos", 400, "VALIDATION_ERROR");
  }

  if (isFutureDate(fechaCompra)) {
    throw new AppError("La fecha de compra no puede ser futura", 400, "VALIDATION_ERROR");
  }

  const precio = Number(precioCompra);
  if (
    !Number.isFinite(precio) ||
    precio < VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min ||
    precio > VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max
  ) {
    throw new AppError(
      `El precio de compra debe estar entre ${VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min} y ${VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max}`,
      400,
      "VALIDATION_ERROR"
    );
  }

  const animal = await Animal.findById(animalId);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  const compra = await Compra.create({
    animalId,
    fechaCompra,
    proveedor: proveedor.trim(),
    precioCompra: precio,
    formaPago,
    observaciones: observaciones?.trim() || null,
  });

  return sendSuccess(res, 201, {
    message: "Compra registrada exitosamente",
    data: {
      ...compra.toObject(),
      animal: {
        identificacion: animal.identificacion,
        nombre: animal.nombre,
      },
    },
  });
});

const listCompras = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { animalId, fechaInicio, fechaFin } = req.query;

  const filter = {};
  if (animalId) filter.animalId = animalId;
  if (fechaInicio || fechaFin) {
    filter.fechaCompra = {};
    if (fechaInicio) filter.fechaCompra.$gte = new Date(fechaInicio);
    if (fechaFin) filter.fechaCompra.$lte = new Date(fechaFin + "T23:59:59");
  }

  const [data, total] = await Promise.all([
    Compra.find(filter)
      .sort({ fechaCompra: -1 })
      .skip(skip)
      .limit(limit)
      .populate("animalId", "identificacion nombre raza"),
    Compra.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    data,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

module.exports = { createCompra, listCompras };
