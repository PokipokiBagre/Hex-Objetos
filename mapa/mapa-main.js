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
        alert("Modo OP Desactivado."); 
        document.getElementById('btn-save-map').classList.add('oculto');
        document.getElementById('btn-ordenar').classList.add('oculto');
        estadoMapa.interaccion.selectedNode = null;
        actualizarPanelInfo(); 
    } else { 
        if (prompt("Contraseña MÁSTER:") === atob('Y2FuZXk=')) { 
            estadoMapa.esAdmin = true; 
            document.getElementById('btn-ordenar').classList.remove('oculto');
            alert("Modo OP Activado.\n- Haz CLIC en un nodo para fijar su menú.\n- Usa el botón 'Auto-Ordenar' para que la IA desenrede el mapa.");
            actualizarPanelInfo(); 
        } 
    } 
};

window.ordenarMapaYifanHu = () => {
    const nodos = estadoMapa.nodos;
    const enlaces = estadoMapa.enlaces;
    const math = estadoMapa.math;
    
    const K = 350; // Constante aumentada por el nuevo tamaño de nodos
    let iteraciones = 150; 
    let temp = 250; 

    nodos.forEach(n => n.modificado = true);
    document.getElementById('btn-save-map').classList.remove('oculto');

    function iterarFisica() {
        if(iteraciones <= 0) {
            alert("¡Mapa ordenado! Si te gusta, pulsa Guardar Cambios.");
            return;
        }

        const disp = new Map();
        nodos.forEach(n => disp.set(n.id, {x:0, y:0}));

        // 1. REPULSIÓN (Se empujan más a lo ancho para no pisar textos)
        for(let i=0; i<nodos.length; i++) {
            for(let j=i+1; j<nodos.length; j++) {
                const u = nodos[i]; const v = nodos[j];
                let dx = u.x - v.x;
                let dy = u.y - v.y;
                let dist = Math.sqrt(dx*dx + dy*dy) || 1;
                
                const f = (K * K) / dist;
                const fx = (dx / dist) * f * 2.5; 
                const fy = (dy / dist) * f;

                disp.get(u.id).x += fx; disp.get(u.id).y += fy;
                disp.get(v.id).x -= fx; disp.get(v.id).y -= fy;
            }
        }

        // 2. ATRACCIÓN
        enlaces.forEach(link => {
            const u = link.source; const v = link.target;
            let dx = u.x - v.x;
            let dy = u.y - v.y;
            let dist = Math.sqrt(dx*dx + dy*dy) || 1;

            const f = (dist * dist) / K;
            const fx = (dx / dist) * f;
            const fy = (dy / dist) * f;

            disp.get(u.id).x -= fx; disp.get(u.id).y -= fy;
            disp.get(v.id).x += fx; disp.get(v.id).y += fy;
        });

        // 3. GRAVEDAD HACIA EL HEX
        nodos.forEach(u => {
            if(!u.isHexNode) {
                let distCentro = Math.sqrt(u.x*u.x + u.y*u.y) || 1;
                const fG = (distCentro * distCentro) / (K * 4); 
                disp.get(u.id).x -= (u.x / distCentro) * fG;
                disp.get(u.id).y -= (u.y / distCentro) * fG;
            }
        });

        // 4. APLICAR
        nodos.forEach(u => {
            if(u.isHexNode) { 
                u.x = 0; u.y = 0; 
                u._rawX = math.originX; u._rawY = math.originY; 
                return; 
            }

            const d = disp.get(u.id);
            const dLen = Math.sqrt(d.x*d.x + d.y*d.y);
            if(dLen > 0) {
                const limit = Math.min(dLen, temp); 
                u.x += (d.x / dLen) * limit;
                u.y += (d.y / dLen) * limit;
                
                // ACTUALIZACIÓN MATEMÁTICA AL RADIO 2500
                u._rawX = (u.x / 2500) * math.maxXDist + math.originX;
                u._rawY = -(u.y / 2500) * math.maxYDist + math.originY;
            }
        });

        temp *= 0.95; 
        iteraciones--;
        requestAnimationFrame(iterarFisica); 
    }

    iterarFisica();
};

window.cambiarEstadoNodo = (id, valor) => {
    const nodo = estadoMapa.nodos.find(n => n.id === id);
    if(nodo) {
        const nuevoEstado = (valor === 'si');
        if (nodo.esConocido !== nuevoEstado) {
            nodo.esConocido = nuevoEstado;
            nodo.modificado = true;
            
            nodo.radio = nodo.esConocido ? 35 : 20;
            let baseName = nodo.nombreOriginal.replace(/\s*\(\d+\)$/, '').trim();
            if (nodo.esConocido) {
                nodo.nombre = `${baseName} (${nodo.hex})`;
            } else {
                let maskName = nodo.id.toLowerCase().includes('hechizo') ? nodo.id : `Hechizo ${nodo.id}`;
                nodo.nombre = `${maskName} (${nodo.hex})`;
            }

            actualizarColoresFlechas(); 
            actualizarPanelInfo(); 
            document.getElementById('btn-save-map').classList.remove('oculto');
        }
    }
};

window.guardarCambiosMapa = async () => {
    const btn = document.getElementById('btn-save-map');
    btn.innerText = "Guardando..."; btn.disabled = true;

    const cambios = estadoMapa.nodos.filter(n => n.modificado).map(n => ({
        id: n.id || n.nombreOriginal, 
        x: n._rawX,
        y: n._rawY,
        conocido: n.esConocido ? 'si' : 'no'
    }));

    if(cambios.length === 0) {
        alert("No hay cambios para guardar.");
        btn.classList.add('oculto');
        btn.disabled = false;
        return;
    }

    try {
        const res = await fetch(API_HECHIZOS, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ accion: 'guardar_mapa', cambios: cambios }) 
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            alert("¡Cambios guardados! Tu constelación está a salvo.");
            estadoMapa.nodos.forEach(n => n.modificado = false);
            btn.classList.add('oculto');
        } else {
            alert("El servidor falló: " + (data.message || 'Error desconocido'));
        }
    } catch(e) {
        alert("Fallo de red al intentar guardar en el servidor.");
    }

    btn.innerText = "💾 GUARDAR CAMBIOS";
    btn.disabled = false;
};

function centrarCamara() {
    if (estadoMapa.nodos.length === 0) return;
    estadoMapa.camara.zoom = window.innerWidth > 1000 ? 0.3 : 0.15; 
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

        if (nodo) {
            estadoMapa.interaccion.selectedNode = nodo;
            if (estadoMapa.esAdmin) {
                estadoMapa.interaccion.draggedNode = nodo;
            }
        } else {
            estadoMapa.interaccion.selectedNode = null; 
            estadoMapa.interaccion.isDraggingBg = true;
        }
        
        actualizarPanelInfo(); 
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
            
            const math = estadoMapa.math;
            // ACTUALIZACIÓN MATEMÁTICA AL RADIO 2500
            n._rawX = (n.x / 2500) * math.maxXDist + math.originX;
            n._rawY = -(n.y / 2500) * math.maxYDist + math.originY;

            n.modificado = true;
            document.getElementById('btn-save-map').classList.remove('oculto');
        } 
        else {
            const nodoBajoCursor = obtenerNodoEnCursor(worldPos.x, worldPos.y);
            if (estadoMapa.interaccion.hoveredNode !== nodoBajoCursor) {
                estadoMapa.interaccion.hoveredNode = nodoBajoCursor;
                
                if (!estadoMapa.interaccion.selectedNode) {
                    actualizarPanelInfo();
                }
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
