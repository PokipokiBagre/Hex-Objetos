import { estadoMapa } from './mapa-state.js';
import { cargarDatos } from './mapa-data.js';
import { inicializarCanvas, dibujarFrame, actualizarPanelInfo } from './mapa-ui.js';

window.onload = async () => {
    inicializarCanvas();
    const barra = document.getElementById('carga-progreso');
    const loadScreen = document.getElementById('loader');

    await cargarDatos(barra);
    
    setTimeout(() => {
        loadScreen.style.opacity = '0';
        setTimeout(() => loadScreen.remove(), 500);
    }, 500);

    iniciarEventosInput();
    bucleRender();
};

function iniciarEventosInput() {
    const canvas = document.getElementById('mapa-canvas');

    // CONVERTIR RATÓN A MUNDO
    const getPosicionMundo = (clientX, clientY) => {
        const { camara } = estadoMapa;
        return {
            x: (clientX - camara.x) / camara.zoom,
            y: (clientY - camara.y) / camara.zoom
        };
    };

    // DETECTAR NODO BAJO EL CURSOR
    const obtenerNodoEnCursor = (worldX, worldY) => {
        // Recorremos en reversa para agarrar el de más arriba si se solapan
        for (let i = estadoMapa.nodos.length - 1; i >= 0; i--) {
            const n = estadoMapa.nodos[i];
            const dist = Math.hypot(n.x - worldX, n.y - worldY);
            if (dist <= n.radio) return n;
        }
        return null;
    };

    // EVENTOS DE RATÓN
    canvas.addEventListener('mousedown', (e) => {
        const worldPos = getPosicionMundo(e.clientX, e.clientY);
        const nodo = obtenerNodoEnCursor(worldPos.x, worldPos.y);

        if (nodo) {
            estadoMapa.interaccion.draggedNode = nodo;
        } else {
            estadoMapa.interaccion.isDraggingBg = true;
        }
        estadoMapa.interaccion.lastMouseX = e.clientX;
        estadoMapa.interaccion.lastMouseY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
        const dx = e.clientX - estadoMapa.interaccion.lastMouseX;
        const dy = e.clientY - estadoMapa.interaccion.lastMouseY;
        
        const worldPos = getPosicionMundo(e.clientX, e.clientY);

        // 1. Lógica de Paneo (Arrastrar fondo)
        if (estadoMapa.interaccion.isDraggingBg) {
            estadoMapa.camara.x += dx;
            estadoMapa.camara.y += dy;
        } 
        // 2. Lógica de Arrastre de Nodo
        else if (estadoMapa.interaccion.draggedNode) {
            estadoMapa.interaccion.draggedNode.x += dx / estadoMapa.camara.zoom;
            estadoMapa.interaccion.draggedNode.y += dy / estadoMapa.camara.zoom;
            estadoMapa.cambiosPendientes = true;
            document.getElementById('btn-save-positions').classList.remove('oculto');
        } 
        // 3. Lógica de Hover (Ratón libre)
        else {
            const nodoBajoCursor = obtenerNodoEnCursor(worldPos.x, worldPos.y);
            if (estadoMapa.interaccion.hoveredNode !== nodoBajoCursor) {
                estadoMapa.interaccion.hoveredNode = nodoBajoCursor;
                actualizarPanelInfo();
                canvas.style.cursor = nodoBajoCursor ? 'pointer' : 'grab';
            }
        }

        estadoMapa.interaccion.lastMouseX = e.clientX;
        estadoMapa.interaccion.lastMouseY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => {
        estadoMapa.interaccion.isDraggingBg = false;
        estadoMapa.interaccion.draggedNode = null;
        canvas.style.cursor = estadoMapa.interaccion.hoveredNode ? 'pointer' : 'grab';
    });

    // EVENTO DE ZOOM CON LA RUEDA
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const { camara } = estadoMapa;
        
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1; // Suavidad del zoom
        const nuevoZoom = Math.max(0.1, Math.min(camara.zoom * zoomDelta, 4)); // Limites de zoom (10% a 400%)
        
        // Matemáticas para hacer zoom hacia el puntero del ratón, no hacia la esquina superior izquierda
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        camara.x = mouseX - (mouseX - camara.x) * (nuevoZoom / camara.zoom);
        camara.y = mouseY - (mouseY - camara.y) * (nuevoZoom / camara.zoom);
        camara.zoom = nuevoZoom;
    }, { passive: false });
}

// Bucle continuo a 60fps
function bucleRender() {
    dibujarFrame();
    requestAnimationFrame(bucleRender);
}
