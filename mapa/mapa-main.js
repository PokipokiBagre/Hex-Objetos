import { estadoMapa } from './mapa-state.js';
import { cargarDatos } from './mapa-data.js';
import { inicializarCanvas, dibujarFrame, actualizarPanelInfo } from './mapa-ui.js';

window.onload = async () => {
    try {
        inicializarCanvas();
        const barra = document.getElementById('carga-progreso');
        const loadScreen = document.getElementById('loader');

        await cargarDatos(barra);
        centrarCamara(); 
        
        if (loadScreen) {
            loadScreen.style.opacity = '0';
            setTimeout(() => loadScreen.remove(), 500);
        }

        iniciarEventosInput();
        bucleRender();
    } catch (error) {
        console.error("Error fatal iniciando el mapa:", error);
    }
};

window.abrirMenuOP = () => { 
    if (estadoMapa.esAdmin) { 
        estadoMapa.esAdmin = false; 
        alert("Modo OP Desactivado. El mapa está bloqueado para edición."); 
        document.getElementById('btn-save-positions').classList.add('oculto');
    } else { 
        if (prompt("Contraseña MÁSTER:") === atob('Y2FuZXk=')) { 
            estadoMapa.esAdmin = true; 
            alert("Modo OP Activado. Puedes arrastrar los nodos para reubicarlos.");
        } 
    } 
};

function centrarCamara() {
    if (estadoMapa.nodos.length === 0) return;
    
    // Al haber normalizado el mapa, sabemos que su tamaño máximo es de 4000x4000 
    // y su centro matemático exacto está en (0,0).
    const mapWidth = 4400; 
    const mapHeight = 4400;

    const zoomX = window.innerWidth / mapWidth;
    const zoomY = window.innerHeight / mapHeight;
    
    estadoMapa.camara.zoom = Math.min(zoomX, zoomY, 1.2);
    
    // Al fijar la cámara en window / 2, el punto (0,0) del mapa quedará exactamente en el centro de tu pantalla
    estadoMapa.camara.x = window.innerWidth / 2;
    estadoMapa.camara.y = window.innerHeight / 2;
}

function iniciarEventosInput() {
    const canvas = document.getElementById('mapa-canvas');
    if(!canvas) return;

    const getPosicionMundo = (clientX, clientY) => {
        const camara = estadoMapa.camara;
        return {
            x: (clientX - camara.x) / camara.zoom,
            y: (clientY - camara.y) / camara.zoom
        };
    };

    const obtenerNodoEnCursor = (worldX, worldY) => {
        for (let i = estadoMapa.nodos.length - 1; i >= 0; i--) {
            const n = estadoMapa.nodos[i];
            const dist = Math.hypot(n.x - worldX, n.y - worldY);
            if (dist <= n.radio) return n;
        }
        return null;
    };

    canvas.addEventListener('mousedown', (e) => {
        const worldPos = getPosicionMundo(e.clientX, e.clientY);
        const nodo = obtenerNodoEnCursor(worldPos.x, worldPos.y);

        if (nodo && estadoMapa.esAdmin) {
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

        if (estadoMapa.interaccion.isDraggingBg) {
            estadoMapa.camara.x += dx;
            estadoMapa.camara.y += dy;
        } 
        else if (estadoMapa.interaccion.draggedNode) {
            estadoMapa.interaccion.draggedNode.x += dx / estadoMapa.camara.zoom;
            estadoMapa.interaccion.draggedNode.y += dy / estadoMapa.camara.zoom;
            estadoMapa.cambiosPendientes = true;
            document.getElementById('btn-save-positions').classList.remove('oculto');
        } 
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

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const camara = estadoMapa.camara;
        const zoomDelta = e.deltaY > 0 ? 0.85 : 1.15; 
        const nuevoZoom = Math.max(0.05, Math.min(camara.zoom * zoomDelta, 4)); 
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        camara.x = mouseX - (mouseX - camara.x) * (nuevoZoom / camara.zoom);
        camara.y = mouseY - (mouseY - camara.y) * (nuevoZoom / camara.zoom);
        camara.zoom = nuevoZoom;
    }, { passive: false });
}

function bucleRender() {
    dibujarFrame();
    requestAnimationFrame(bucleRender);
}
