const mongoose = require("mongoose");
const { FORMAS_PAGO } = require("../constants/enums");

const compraSchema = new mongoose.Schema(
  {
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
    },
    fechaCompra: {
      type: Date,
      required: true,
    },
    proveedor: {
      type: String,
      required: true,
      trim: true,
    },
    precioCompra: {
      type: Number,
      required: true,
      min: 1,
    },
    formaPago: {
      type: String,
      required: true,
      enum: FORMAS_PAGO,
    },
    observaciones: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

compraSchema.index({ animalId: 1, fechaCompra: -1 });

module.exports = mongoose.model("Compra", compraSchema);
