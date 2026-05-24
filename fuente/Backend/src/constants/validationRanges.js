const VALIDATION_RANGES = {
  PESO_KG: {
    min: 30,
    max: 1500,
  },
  ALTURA_CM: {
    min: 50,
    max: 250,
  },
  CONDICION_CORPORAL: {
    min: 1,
    max: 5,
  },
  PRODUCCION_LECHE_L_DIA: {
    min: 0,
    max: 100,
  },
  PRECIO_LECHE_POR_LITRO: {
    min: 100,
    max: 100000,
  },
  COSTO_TOTAL_PERIODO: {
    min: 0,
    max: 1000000000,
  },
  CANTIDAD_ALIMENTO_KG_DIA: {
    min: 0.1,
    max: 100,
  },
  TEMPERATURA_C: {
    min: 35,
    max: 43,
  },
  DURACION_TRATAMIENTO_DIAS: {
    min: 1,
    max: 365,
  },
  PRECIO_COMPRA_VENTA: {
    min: 1,
    max: 1000000000,
  },
  STOCK_MEDICAMENTO: {
    min: 0,
    max: 1000000,
  },
};

module.exports = VALIDATION_RANGES;