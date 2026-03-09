import { estadoMapa } from './mapa-state.js';
import { cargarDatos, actualizarColoresFlechas, API_HECHIZOS } from './mapa-data.js';
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
        document.getElementById('btn-save-map').classList.add('oculto');
        actualizarPanelInfo(); // Recargar panel para quitar el dropdown
    } else { 
        if (prompt("Contraseña MÁSTER:") === atob('Y2FuZXk=')) { 
            estadoMapa.esAdmin = true; 
            alert("Modo OP Activado.\n- Puedes arrastrar nodos.\n- Al poner el ratón sobre un nodo verás un menú para Descubrir/Sellar.");
            actualizarPanelInfo(); 
        } 
    } 
};

// FUNCIÓN GLOBAL: Cambia el estado del Dropdown
window.cambiarEstadoNodo = (id, valor) => {
    const nodo = estadoMapa.nodos.find(n => n.id === id);
    if(nodo) {
        const nuevoEstado = (valor === 'si');
        if (nodo.esConocido !== nuevoEstado) {
            nodo.esConocido = nuevoEstado;
            nodo.modificado = true;
            
            // Recalcular la estética del nodo
            nodo.radio = nodo.esConocido ? 20 : 12;
            let baseName = nodo.nombreOriginal.replace(/\s*\(\d+\)$/, '').trim();
            if (nodo.esConocido) {
                nodo.nombre = `${baseName} (${nodo.hex})`;
            } else {
                let maskName = nodo.id.toLowerCase().includes('hechizo') ? nodo.id : `Hechizo ${nodo.id}`;
                nodo.nombre = `${maskName} (${nodo.hex})`;
            }

            actualizarColoresFlechas(); // Recalcula las dependencias de los demás
            actualizarPanelInfo(); // Refresca los textos en el panel
            document.getElementById('btn-save-map').classList.remove('oculto');
        }
    }
};

// FUNCIÓN GLOBAL: Llama a la API para guardar los cambios
window.guardarCambiosMapa = async () => {
    const btn = document.getElementById('btn-save-map');
    btn.innerText = "Guardando..."; btn.disabled = true;

    // Solo enviamos los que cambiaron
    const cambios = estadoMapa.nodos.filter(n => n.modificado).map(n => ({
        id: n.id,
        x: n._rawX,
        y: n._rawY,
        conocido: n.esConocido ? 'si' : 'no'
    }));

    try {
        // En tu Google Apps Script deberás atrapar la acción 'guardar_mapa'
        const res = await fetch(API_HECHIZOS, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ accion: 'guardar_mapa', cambios: cambios }) 
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            alert("¡Cambios del mapa guardados con éxito!");
            estadoMapa.nodos.forEach(n => n.modificado = false);
            btn.classList.add('oculto');
        } else {
            alert("El servidor no pudo guardar: " + (data.message || 'Error desconocido'));
        }
    } catch(e) {
        alert("Fallo de red al intentar guardar en el servidor.");
    }

    btn.innerText = "💾 Guardar Cambios";
    btn.disabled = false;
};

function centrarCamara() {
    if (estadoMapa.nodos.length === 0) return;
    estadoMapa.camara.zoom = window.innerWidth > 1000 ? 0.6 : 0.3; 
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
            const n = estadoMapa.interaccion.draggedNode;
            n.x += dx / estadoMapa.camara.zoom;
            n.y += dy / estadoMapa.camara.zoom;
            
            // Reversa matemática para que guarde las coordenadas originales
            const math = estadoMapa.math;
            n._rawX = (n.x / 5000) * math.maxDist + math.originX;
            n._rawY = -(n.y / 5000) * math.maxDist + math.originY;

            n.modificado = true;
            document.getElementById('btn-save-map').classList.remove('oculto');
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
