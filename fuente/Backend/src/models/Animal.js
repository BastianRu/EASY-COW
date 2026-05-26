const mongoose = require("mongoose");
const { RAZAS, SEXOS, ESTADOS_ANIMAL } = require("../constants/enums");
const { PESO_KG } = require("../constants/validationRanges");

const animalSchema = new mongoose.Schema(
  {
    identificacion: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nombre: {
      type: String,
      trim: true,
      default: null,
    },
    raza: {
      type: String,
      required: true,
      enum: RAZAS,
    },
    sexo: {
      type: String,
      required: true,
      enum: SEXOS,
    },
    fechaNacimiento: {
      type: Date,
      required: true,
    },
    peso: {
      type: Number,
      required: true,
      min: [PESO_KG.min, `El peso debe ser mayor o igual a ${PESO_KG.min} kg`],
      max: [PESO_KG.max, `El peso debe ser menor o igual a ${PESO_KG.max} kg`],
    },
    color: {
      type: String,
      trim: true,
      default: null,
    },
    procedencia: {
      type: String,
      trim: true,
      default: null,
    },
    observaciones: {
      type: String,
      trim: true,
      default: null,
    },
    esCria: {
      type: Boolean,
      default: false,
    },
    madreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Animal",
      default: null,
    },
    estado: {
      type: String,
      enum: ESTADOS_ANIMAL,
      default: "activo",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

animalSchema.index({ nombre: 1 });

module.exports = mongoose.model("Animal", animalSchema);
