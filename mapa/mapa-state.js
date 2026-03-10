export const estadoMapa = {
    esAdmin: false,
    jugadorActivo: 'Todos',
    jugadores: [],
    inventario: {},
    vistaJugador: {
        posesiones: new Set(),
        aprendibles: new Set(),
        rastreo: new Set()
    },
    nodos: [],
    enlaces: [],
    math: { originX: 0, originY: 0, maxXDist: 1, maxYDist: 1 }, 
    camara: { x: window.innerWidth/2, y: window.innerHeight/2, zoom: 0.8 },
    interaccion: {
        isDraggingBg: false,
        draggedNode: null,
        hoveredNode: null,
        selectedNode: null, 
        lastMouseX: 0,
        lastMouseY: 0
    }
};

export const COLOR_AFINIDAD = {
    'Física': '#e2a673',
    'Energética': '#f3b67a',
    'Espiritual': '#7df0a7',
    'Mando': '#a4d3f2',
    'Psíquica': '#dcb1f0',
    'Oscura': '#c285ff'
};

export const ESTETICA = {
    lineaDescubierta: 'rgba(210, 190, 230, 0.3)', 
    lineaMostaza: 'rgba(212, 175, 55, 0.4)',       
    lineaRosa: 'rgba(200, 60, 100, 0.35)',         
    lineaPrecedente: 'rgba(138, 43, 226, 0.45)',   // Violeta Selección
    lineaSaliente: 'rgba(255, 236, 139, 0.45)'     // Dorado Selección
};

// --- NUEVA SECCIÓN PARA VISTA PERSONAJE ---
export const COLORES_JUGADOR = {
    posesionMorada: 'rgba(138, 43, 226, 0.45)', // El Morado de lo que ya tienes
    doradoInmediato: 'rgba(255, 215, 0, 0.5)',   // Amarillo Sólido (Aprendible ya)
    doradoMedio: 'rgba(218, 165, 32, 0.5)',      // Dorado Medio (Progreso 40-75%)
    doradoTenue: 'rgba(238, 232, 170, 0.5)',     // Dorado Pálido (Progreso < 40%)
    doradoRastreo: 'rgba(212, 175, 55, 0.15)',   // Amarillo Traslúcido (Precedentes)
    fondoNeutro: 'rgba(80, 80, 80, 0.15)'        // Gris de los nodos irrelevantes
};
