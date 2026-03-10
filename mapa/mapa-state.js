export const estadoMapa = {
    esAdmin: false,
    nodos: [],
    enlaces: [],
    // SCALE absoluto: Evita que el mapa se comprima al alejar nodos
    math: { originX: 0, originY: 0, scale: 3.5 }, 
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

// ESTÉTICA ROLERA MEJORADA
export const ESTETICA = {
    lineaDescubierta: 'rgba(130, 90, 160, 0.4)', // Violeta grisáceo muy tenue y delgado (EX-BLANCA)
    lineaMostaza: 'rgba(212, 175, 55, 0.8)',     // Mostaza para incompletos
    lineaRosa: 'rgba(200, 60, 100, 0.6)',        // Rosa para sellados
    lineaPrecedente: 'rgba(138, 43, 226, 1)',    // Morado Violeta (Hover/Selección)
    lineaSaliente: 'rgba(255, 236, 139, 1)'      // Amarillo Dorado (Hover/Selección)
};
