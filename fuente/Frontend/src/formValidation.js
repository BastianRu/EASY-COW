export const VALIDATION_RANGES = {
    PESO_KG: { min: 30, max: 1500 },
    ALTURA_CM: { min: 50, max: 250 },
    CONDICION_CORPORAL: { min: 1, max: 5 },
    PRODUCCION_LECHE_L_DIA: { min: 1, max: 100 },
    PRECIO_LECHE_POR_LITRO: { min: 100, max: 100000 },
    COSTO_TOTAL_PERIODO: { min: 0, max: 1000000000 },
    CANTIDAD_ALIMENTO_KG_DIA: { min: 0.1, max: 100 },
    TEMPERATURA_C: { min: 35, max: 43 },
    DURACION_TRATAMIENTO_DIAS: { min: 1, max: 365 },
    PRECIO_COMPRA_VENTA: { min: 1, max: 1000000000 },
    STOCK_MEDICAMENTO: { min: 0, max: 1000000 },
};

export function isFutureDate(value) {
    if (!value) return false;
    const inputDate = new Date(value);
    if (Number.isNaN(inputDate.getTime())) return true;
    return inputDate.getTime() > Date.now();
}

export function isNumberInRange(value, { min, max, integer = false, allowEmpty = false }) {
    if (value === undefined || value === null || value === '') {
        return allowEmpty;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return false;
    if (integer && !Number.isInteger(numericValue)) return false;
    if (min !== undefined && numericValue < min) return false;
    if (max !== undefined && numericValue > max) return false;
    return true;
}

export function hasWhitespaceIssues(value) {
    if (!value || typeof value !== 'string') return false;
    return value !== value.trim() || /\s{2,}/.test(value);
}

export function isValidFreeText(value, { required = false, minLength = 2 } = {}) {
    if (!value || typeof value !== 'string' || value === '') return !required;
    if (hasWhitespaceIssues(value)) return false;
    return value.length >= minLength;
}

