const Animal = require("../models/Animal");
const Compra = require("../models/Compra");
const Venta = require("../models/Venta");
const RegistroEnfermedad = require("../models/RegistroEnfermedad");
const Tratamiento = require("../models/Tratamiento");
const ActualizacionMensual = require("../models/ActualizacionMensual");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/http");

const TIPOS_REPORTE = ["compras", "ventas", "inventario", "enfermedades", "tratamientos", "actualizaciones"];

const buildDateFilter = (field, fechaInicio, fechaFin) => {
  if (!fechaInicio && !fechaFin) return {};
  const dateFilter = {};
  if (fechaInicio) dateFilter.$gte = new Date(fechaInicio);
  if (fechaFin) dateFilter.$lte = new Date(fechaFin + "T23:59:59");
  return { [field]: dateFilter };
};

const getReporte = asyncHandler(async (req, res) => {
  const { tipo, fechaInicio, fechaFin, animalId, raza, sexo, estado } = req.query;

  if (!tipo || !TIPOS_REPORTE.includes(tipo)) {
    throw new AppError(
      `El tipo de reporte es requerido. Valores permitidos: ${TIPOS_REPORTE.join(", ")}`,
      400,
      "VALIDATION_ERROR"
    );
  }

  let data = [];
  let titulo = "";

  switch (tipo) {
    case "compras": {
      titulo = "Reporte de Compras";
      const filter = { ...buildDateFilter("fechaCompra", fechaInicio, fechaFin) };
      if (animalId) filter.animalId = animalId;
      data = await Compra.find(filter)
        .sort({ fechaCompra: -1 })
        .populate("animalId", "identificacion nombre raza sexo");
      break;
    }

    case "ventas": {
      titulo = "Reporte de Ventas";
      const filter = { ...buildDateFilter("fechaVenta", fechaInicio, fechaFin) };
      if (animalId) filter.animalId = animalId;
      data = await Venta.find(filter)
        .sort({ fechaVenta: -1 })
        .populate("animalId", "identificacion nombre raza sexo");
      break;
    }

    case "inventario": {
      titulo = "Reporte de Inventario Animal";
      const filter = {};
      if (estado) filter.estado = estado;
      if (raza) filter.raza = raza;
      if (sexo) filter.sexo = sexo;
      if (fechaInicio || fechaFin) {
        filter.createdAt = {};
        if (fechaInicio) filter.createdAt.$gte = new Date(fechaInicio);
        if (fechaFin) filter.createdAt.$lte = new Date(fechaFin + "T23:59:59");
      }
      data = await Animal.find(filter).sort({ createdAt: -1 });
      break;
    }

    case "enfermedades": {
      titulo = "Reporte de Enfermedades";
      const filter = { ...buildDateFilter("fechaDeteccion", fechaInicio, fechaFin) };
      if (animalId) filter.animalId = animalId;
      if (estado) filter.estadoActual = estado;
      data = await RegistroEnfermedad.find(filter)
        .sort({ fechaDeteccion: -1 })
        .populate("animalId", "identificacion nombre raza");
      break;
    }

    case "tratamientos": {
      titulo = "Reporte de Tratamientos";
      const filter = { ...buildDateFilter("fechaInicio", fechaInicio, fechaFin) };
      if (animalId) filter.animalId = animalId;
      if (estado) filter.estadoTratamiento = estado;
      data = await Tratamiento.find(filter)
        .sort({ fechaInicio: -1 })
        .populate("animalId", "identificacion nombre raza");
      break;
    }

    case "actualizaciones": {
      titulo = "Reporte de Actualizaciones Mensuales";
      const filter = { ...buildDateFilter("fechaRegistro", fechaInicio, fechaFin) };
      if (animalId) filter.animalId = animalId;
      data = await ActualizacionMensual.find(filter)
        .sort({ fechaRegistro: -1 })
        .populate("animalId", "identificacion nombre raza");
      break;
    }
  }

  if (data.length === 0) {
    return sendSuccess(res, 200, {
      message: "No hay información disponible para los filtros aplicados",
      data: [],
      titulo,
      total: 0,
    });
  }

  return sendSuccess(res, 200, {
    data,
    titulo,
    total: data.length,
    message: null,
  });
});

module.exports = { getReporte };
