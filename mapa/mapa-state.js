export const estadoMapa = {
    esAdmin: false,
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

// ESTÉTICA DE ROL DEFINITIVA
export const ESTETICA = {
    // Violeta mucho más claro y blanquecino para que resalte en el fondo oscuro
    lineaDescubierta: 'rgba(210, 190, 230, 0.55)', 
    lineaMostaza: 'rgba(212, 175, 55, 0.8)',       
    lineaRosa: 'rgba(200, 60, 100, 0.6)',          
    lineaPrecedente: 'rgba(138, 43, 226, 1)',      
    lineaSaliente: 'rgba(255, 236, 139, 1)'        
};
