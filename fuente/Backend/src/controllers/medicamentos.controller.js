const Medicamento = require("../models/Medicamento");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess, parsePagination, buildPaginationMeta } = require("../utils/http");
const VALIDATION_RANGES = require("../constants/validationRanges");

const createMedicamento = asyncHandler(async (req, res) => {
  const { nombre, tipoMedicamento, presentacion, descripcion, dosis, stockActual, stockMinimo, fechaVencimiento, observaciones } = req.body;

  if (!nombre?.trim() || !tipoMedicamento || !presentacion || stockActual === undefined) {
    throw new AppError("Campos obligatorios incompletos", 400, "VALIDATION_ERROR");
  }

  const stock = Number(stockActual);
  if (
    !Number.isFinite(stock) ||
    stock < VALIDATION_RANGES.STOCK_MEDICAMENTO.min ||
    stock > VALIDATION_RANGES.STOCK_MEDICAMENTO.max
  ) {
    throw new AppError(
      `El stock actual debe estar entre ${VALIDATION_RANGES.STOCK_MEDICAMENTO.min} y ${VALIDATION_RANGES.STOCK_MEDICAMENTO.max}`,
      400,
      "VALIDATION_ERROR"
    );
  }

  const existe = await Medicamento.findOne({ nombre: { $regex: new RegExp(`^${nombre.trim()}$`, "i") } });
  if (existe) {
    throw new AppError("Ya existe un medicamento registrado con ese nombre", 400, "VALIDATION_ERROR");
  }

  const medicamento = await Medicamento.create({
    nombre: nombre.trim(),
    tipoMedicamento,
    presentacion,
    descripcion: descripcion?.trim() || null,
    dosis: dosis?.trim() || null,
    stockActual: stock,
    stockMinimo: stockMinimo !== undefined && stockMinimo !== "" ? Number(stockMinimo) : null,
    fechaVencimiento: fechaVencimiento || null,
    observaciones: observaciones?.trim() || null,
  });

  return sendSuccess(res, 201, {
    message: "Medicamento registrado exitosamente",
    data: medicamento,
  });
});

const listMedicamentos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { tipoMedicamento, search } = req.query;

  const filter = {};
  if (tipoMedicamento) filter.tipoMedicamento = tipoMedicamento;
  if (search) filter.nombre = { $regex: new RegExp(search, "i") };

  const [data, total] = await Promise.all([
    Medicamento.find(filter).sort({ nombre: 1 }).skip(skip).limit(limit),
    Medicamento.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    data,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

module.exports = { createMedicamento, listMedicamentos };
