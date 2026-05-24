const Animal = require("../models/Animal");
const RegistroEnfermedad = require("../models/RegistroEnfermedad");
const Tratamiento = require("../models/Tratamiento");
const ActualizacionMensual = require("../models/ActualizacionMensual");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/http");

const getHistorial = asyncHandler(async (req, res) => {
  const { animalId } = req.query;

  if (!animalId) {
    throw new AppError("El identificador del animal es requerido", 400, "VALIDATION_ERROR");
  }

  const animal = await Animal.findById(animalId);
  if (!animal) {
    throw new AppError("Animal no encontrado", 404, "NOT_FOUND");
  }

  const [enfermedades, tratamientos, actualizaciones] = await Promise.all([
    RegistroEnfermedad.find({ animalId: animal._id }).sort({ fechaDeteccion: -1 }),
    Tratamiento.find({ animalId: animal._id }).sort({ fechaInicio: -1 }),
    ActualizacionMensual.find({ animalId: animal._id }).sort({ fechaRegistro: -1 }),
  ]);

  return sendSuccess(res, 200, {
    data: {
      animal,
      enfermedades,
      tratamientos,
      actualizaciones,
    },
  });
});

module.exports = { getHistorial };
