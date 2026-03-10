export const estadoMapa = {
    esAdmin: false,
    nodos: [],
    enlaces: [],
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

// ESTÉTICA ROLERA
export const ESTETICA = {
    lineaDescubierta: 'rgba(160, 120, 180, 0.35)', // Violeta grisáceo sutil y delgado (Reemplaza al blanco)
    lineaMostaza: 'rgba(212, 175, 55, 0.8)',       // Mostaza para incompletos
    lineaRosa: 'rgba(200, 60, 100, 0.6)',          // Rosa para sellados
    lineaPrecedente: 'rgba(138, 43, 226, 1)',      // Morado Violeta (Hover)
    lineaSaliente: 'rgba(255, 236, 139, 1)'        // Amarillo Dorado (Hover)
};
