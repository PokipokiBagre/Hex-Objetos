export let misGlobal = []; // Array para respetar el orden exacto del CSV
export let jugadoresActivos = []; // Nombres extraídos del CSV de Stats

export let estadoUI = {
    esAdmin: false,
    verFinalizadas: false,
    colaCambios: { misiones: {} }, // Guarda los cambios para el Google Sheet
    misionEditando: null
};

export const RECOMPENSAS_CLASE = {
    "1": "Recompensas Básicas (Materiales comunes, poco HEX).",
    "2": "Recompensas Medias (Equipamiento estándar, HEX moderado).",
    "3": "Recompensas Altas (Objetos raros, buen HEX).",
    "4": "Recompensas Épicas (Artefactos únicos, gran cantidad de HEX).",
    "5": "Recompensas Legendarias (Poder masivo, impacto en la trama)."
};
