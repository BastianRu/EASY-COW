const mongoose = require("mongoose");
const { TIPOS_MEDICAMENTO, PRESENTACIONES_MEDICAMENTO } = require("../constants/enums");

const medicamentoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tipoMedicamento: {
      type: String,
      required: true,
      enum: TIPOS_MEDICAMENTO,
    },
    presentacion: {
      type: String,
      required: true,
      enum: PRESENTACIONES_MEDICAMENTO,
    },
    descripcion: {
      type: String,
      trim: true,
      default: null,
    },
    dosis: {
      type: String,
      trim: true,
      default: null,
    },
    stockActual: {
      type: Number,
      required: true,
      min: 0,
    },
    stockMinimo: {
      type: Number,
      min: 0,
      default: null,
    },
    fechaVencimiento: {
      type: Date,
      default: null,
    },
    observaciones: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

medicamentoSchema.index({ tipoMedicamento: 1 });

module.exports = mongoose.model("Medicamento", medicamentoSchema);
