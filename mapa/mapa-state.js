export const estadoMapa = {
    esAdmin: false,
    nodos: [],
    enlaces: [],
    math: { originX: 0, originY: 0, maxDist: 1 },
    camara: { x: window.innerWidth/2, y: window.innerHeight/2, zoom: 0.8 },
    interaccion: {
        isDraggingBg: false,
        draggedNode: null,
        hoveredNode: null,
        selectedNode: null, // NUEVO: Bloquea el panel al hacer clic
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
