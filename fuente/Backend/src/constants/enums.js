const RAZAS = ["holstein", "brahman", "angus", "hereford", "criollo", "mestizo"];
const SEXOS = ["macho", "hembra"];
const ESTADOS_ANIMAL = ["activo", "vendido", "muerto"];

const ESTADOS_REPRODUCTIVOS = ["vacia", "gestante", "lactante", "servicio"];

const ENFERMEDADES = [
  "mastitis",
  "fiebre_aftosa",
  "brucelosis",
  "parasitosis",
  "neumonia",
  "diarrea",
  "cojera",
  "otra",
];

const ESTADOS_GENERALES = ["critico", "grave", "moderado", "leve"];
const ESTADOS_ENFERMEDAD = ["activo", "recuperado", "fallecido"];

const FRECUENCIAS_TRATAMIENTO = ["cada_6h", "cada_8h", "cada_12h", "cada_24h", "cada_48h"];
const VIAS_ADMINISTRACION = ["intramuscular", "intravenosa", "subcutanea", "oral", "topica"];
const ESTADOS_TRATAMIENTO = ["en_curso", "completado", "suspendido", "actualizar"];

const TIPOS_DIETA = ["pastoreo", "semi_estabulado", "estabulado", "especial"];
const FRECUENCIAS_ALIMENTACION = ["1_vez", "2_veces", "3_veces", "continuo"];
const OBJETIVOS_DIETA = ["mantenimiento", "engorde", "produccion_leche", "gestacion", "recuperacion"];

const ROLES_USUARIO = ["admin", "usuario", "veterinario"];

const FORMAS_PAGO = ["efectivo", "transferencia", "cheque", "credito"];

module.exports = {
  RAZAS,
  SEXOS,
  ESTADOS_ANIMAL,
  ESTADOS_REPRODUCTIVOS,
  ENFERMEDADES,
  ESTADOS_GENERALES,
  ESTADOS_ENFERMEDAD,
  FRECUENCIAS_TRATAMIENTO,
  VIAS_ADMINISTRACION,
  ESTADOS_TRATAMIENTO,
  TIPOS_DIETA,
  FRECUENCIAS_ALIMENTACION,
  OBJETIVOS_DIETA,
  ROLES_USUARIO,
  FORMAS_PAGO,
};
