const mongoose = require("mongoose");
const { FORMAS_PAGO } = require("../constants/enums");

const ventaSchema = new mongoose.Schema(
  {
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      required: true,
    },
    fechaVenta: {
      type: Date,
      required: true,
    },
    comprador: {
      type: String,
      required: true,
      trim: true,
    },
    precioVenta: {
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

ventaSchema.index({ animalId: 1, fechaVenta: -1 });

module.exports = mongoose.model("Venta", ventaSchema);
