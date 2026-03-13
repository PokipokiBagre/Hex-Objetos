import { estadoMapa } from './mapa-state.js';
import { API_HECHIZOS, actualizarColoresFlechas } from './mapa-data.js';

const editor = {
    activa: false,
    seleccionMultiple: new Set(),
    herramienta: 'cursor', 
    tempLink: null,
    boxStart: null,
    boxCurrent: null,
    hasDragged: false, 
    isShiftPressed: false, 
    cambiosPendientes: { nodos: {}, enlaces: [] }
};

window.mapaEditor = editor;

window.toggleModoEdicion = () => {
    editor.activa = !editor.activa;
    const panel = document.getElementById('panel-edicion-avanzada');
    const btn = document.getElementById('btn-editar-mapa');
    
    if (editor.activa) {
        panel.classList.remove('oculto');
        btn.style.background = '#00ffff'; btn.style.color = '#000';
        document.getElementById('panel-info').classList.add('oculto'); 
        estadoMapa.interaccion.selectedNode = null;
        renderPanelEdicion();
    } else {
        editor.desactivar();
    }
};

editor.desactivar = () => {
    editor.activa = false;
    document.getElementById('panel-edicion-avanzada').classList.add('oculto');
    const btn = document.getElementById('btn-editar-mapa');
    if(btn) { btn.style.background = '#4a004a'; btn.style.color = 'var(--gold)'; }
    editor.seleccionMultiple.clear();
    editor.tempLink = null;
    editor.boxStart = null;
    editor.boxCurrent = null;
    editor.herramienta = 'cursor';
};

editor.setHerramienta = (herr) => {
    editor.herramienta = herr;
    renderPanelEdicion();
};

// --- INTERACCIÓN CON RATÓN AVANZADA ---
editor.onMouseDown = (e, nodo, worldPos) => {
    editor.hasDragged = false; 
    editor.isShiftPressed = e.shiftKey; 

    if (editor.herramienta === 'enlace') {
        if (nodo) {
            editor.tempLink = { source: nodo, startX: nodo.x, startY: nodo.y, endX: worldPos.x, endY: worldPos.y };
        }
    } else {
        if (nodo) {
            if (e.shiftKey) {
                if (editor.seleccionMultiple.has(nodo)) editor.seleccionMultiple.delete(nodo);
                else editor.seleccionMultiple.add(nodo);
            } else {
                if (!editor.seleccionMultiple.has(nodo)) {
                    editor.seleccionMultiple.clear();
                    editor.seleccionMultiple.add(nodo);
                }
            }
            estadoMapa.interaccion.draggedNode = nodo;
        } else {
            if (e.shiftKey) {
                editor.seleccionMultiple.clear(); 
                editor.boxStart = { ...worldPos };
                editor.boxCurrent = { ...worldPos };
            } else {
                estadoMapa.interaccion.isDraggingBg = true;
            }
        }
        renderPanelEdicion();
    }
};

editor.onMouseMove = (e, dx, dy, worldPos) => {
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) editor.hasDragged = true; 
    editor.isShiftPressed = e.shiftKey;

    if (editor.tempLink) {
        editor.tempLink.endX = worldPos.x;
        editor.tempLink.endY = worldPos.y;
    } else if (editor.boxStart) {
        editor.boxCurrent = { ...worldPos };
    } else if (estadoMapa.interaccion.draggedNode) {
        const z = estadoMapa.camara.zoom;
        editor.seleccionMultiple.forEach(n => {
            n.x += dx / z;
            n.y += dy / z;
            n.modificado = true;
        });
    } else if (estadoMapa.interaccion.isDraggingBg) {
        estadoMapa.camara.x += dx;
        estadoMapa.camara.y += dy;
    }
};

editor.onMouseUp = (e, nodo) => {
    editor.isShiftPressed = e.shiftKey;
    
    if (editor.tempLink) {
        if (nodo && nodo !== editor.tempLink.source) {
            if (e.shiftKey && editor.seleccionMultiple.has(editor.tempLink.source) && editor.seleccionMultiple.size > 1) {
                editor.seleccionMultiple.forEach(n => {
                    if (n !== nodo) crearEnlace(n, nodo);
                });
            } else {
                crearEnlace(editor.tempLink.source, nodo);
            }
        }
        editor.tempLink = null;
    } else if (editor.boxStart) {
        const minX = Math.min(editor.boxStart.x, editor.boxCurrent.x);
        const maxX = Math.max(editor.boxStart.x, editor.boxCurrent.x);
        const minY = Math.min(editor.boxStart.y, editor.boxCurrent.y);
        const maxY = Math.max(editor.boxStart.y, editor.boxCurrent.y);

        estadoMapa.nodos.forEach(n => {
            if (n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY) {
                editor.seleccionMultiple.add(n);
            }
        });
        editor.boxStart = null;
        editor.boxCurrent = null;
        renderPanelEdicion();
    } else if (estadoMapa.interaccion.isDraggingBg) {
        if (!editor.hasDragged && !e.shiftKey) {
            editor.seleccionMultiple.clear();
            renderPanelEdicion();
        }
    }
    
    estadoMapa.interaccion.isDraggingBg = false;
    estadoMapa.interaccion.draggedNode = null;
};

// --- CREACIÓN LÓGICA E ID INTELIGENTE (RECICLAJE) ---
function getNextId() {
    const usedIds = new Set();
    estadoMapa.nodos.forEach(n => {
        const match = (n.id || n.nombreOriginal).match(/\d+/); 
        if (match) usedIds.add(parseInt(match[0]));
    });
    
    let i = 1;
    while (usedIds.has(i)) i++; 
    return i;
}

window.crearNodoNuevo = () => {
    const newIdNum = getNextId();
    const nuevo = {
        id: `Hechizo ${newIdNum}`,
        nombreOriginal: `Hechizo ${newIdNum}`,
        nombre: `Hechizo ${newIdNum} (0)`,
        afinidad: '', // <-- AHORA INICIA EN BLANCO
        clase: 'Clase 1',
        hex: 0,
        resumen: '', efecto: '', overcast: '', undercast: '', especial: '',
        esConocido: false, isHexNode: false,
        x: ((window.innerWidth/2) - estadoMapa.camara.x) / estadoMapa.camara.zoom,
        y: ((window.innerHeight/2) - estadoMapa.camara.y) / estadoMapa.camara.zoom,
        radio: 28, incomingSources: [], modificado: true, _esNuevo: true
    };
    estadoMapa.nodos.push(nuevo);
    registrarCambioNodo(nuevo);
    
    editor.seleccionMultiple.clear();
    editor.seleccionMultiple.add(nuevo);
    editor.herramienta = 'cursor';
    renderPanelEdicion();
};

function crearEnlace(source, target) {
    if (estadoMapa.enlaces.some(e => e.source === source && e.target === target)) return; 
    
    const newLink = { source, target };
    estadoMapa.enlaces.push(newLink);
    target.incomingSources.push(source);
    
    editor.cambiosPendientes.enlaces.push({ source: source.id, target: target.id, eliminado: false });
    actualizarColoresFlechas();
}

// --- ACTUALIZACIÓN DE DATOS ---
window.actualizarDatoNodo = (campo, valor) => {
    editor.seleccionMultiple.forEach(n => {
        n[campo] = valor;
        n.modificado = true;
        
        if (campo === 'nombreOriginal' || campo === 'hex') {
            n.nombre = `${n.nombreOriginal} (${n.hex})`;
        }
        if (campo === 'id' && n._esNuevo) {
            n.nombreOriginal = valor;
            n.nombre = `${valor} (${n.hex})`;
        }
        registrarCambioNodo(n);
    });
    if(campo === 'afinidad') renderPanelEdicion();
};

function registrarCambioNodo(n) {
    editor.cambiosPendientes.nodos[n.id] = {
        idOriginal: n._oldId || n.id,
        eliminado: false,
        datos: {
            "ID": n.id, "Nombre": n.nombreOriginal, "HEX": n.hex, "Clase": n.clase, "Afinidad": n.afinidad,
            "Resumen": n.resumen, "Efecto": n.efecto, "Overcast 100%": n.overcast, "Undercast 50%": n.undercast,
            "Especial": n.especial, "X": n.x, "Y": n.y, "Conocido": n.esConocido ? 'si' : 'no'
        }
    };
}

window.actualizarColorPersonalizado = (afinidad, hexColor) => {
    let c = hexColor.substring(1);
    let rgb = parseInt(c, 16);
    let r = Math.max(0, (rgb >> 16) - 50);
    let g = Math.max(0, ((rgb >> 8) & 0x00FF) - 50);
    let b = Math.max(0, (rgb & 0x0000FF) - 50);
    let borderHex = `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    
    window.mapaColores[afinidad] = { t: hexColor, b: borderHex };
    localStorage.setItem('hex_map_colors', JSON.stringify(window.mapaColores)); 
};

window.eliminarSeleccion = () => {
    if(!confirm("¿Destruir los nodos seleccionados y todas las flechas conectadas a ellos?")) return;
    
    editor.seleccionMultiple.forEach(n => {
        estadoMapa.enlaces = estadoMapa.enlaces.filter(e => {
            if (e.source === n || e.target === n) {
                editor.cambiosPendientes.enlaces.push({ source: e.source.id, target: e.target.id, eliminado: true });
                return false;
            }
            return true;
        });
        
        estadoMapa.nodos.forEach(other => {
            other.incomingSources = other.incomingSources.filter(s => s !== n);
        });

        estadoMapa.nodos = estadoMapa.nodos.filter(x => x !== n);
        editor.cambiosPendientes.nodos[n.id] = { idOriginal: n.id, eliminado: true };
    });
    
    editor.seleccionMultiple.clear();
    actualizarColoresFlechas();
    renderPanelEdicion();
};

window.guardarEdicionAvanzada = async () => {
    estadoMapa.nodos.forEach(n => { if(n.modificado) registrarCambioNodo(n); });

    const payload = {
        accion: 'guardar_edicion_completa',
        nodos: Object.values(editor.cambiosPendientes.nodos),
        enlaces: editor.cambiosPendientes.enlaces,
        afinidades: window.mapaColores 
    };

    if (payload.nodos.length === 0 && payload.enlaces.length === 0 && Object.keys(window.mapaColores).length === 0) {
        return alert("No has hecho ningún cambio estructural.");
    }

    const btn = document.getElementById('btn-save-editor');
    btn.innerText = "Sincronizando con Sheets..."; btn.disabled = true;

    try {
        const res = await fetch(API_HECHIZOS, { method: 'POST', body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.status === 'success') {
            alert("¡Mapa y Afinidades guardados en Google Sheets!");
            editor.cambiosPendientes = { nodos: {}, enlaces: [] };
            estadoMapa.nodos.forEach(n => { n.modificado = false; n._esNuevo = false; n._oldId = n.id; });
        } else {
            alert("Fallo del servidor: " + data.message);
        }
    } catch(e) { alert("Error de Red."); }
    
    btn.innerText = "💾 GUARDAR ESTRUCTURA"; btn.disabled = false;
};

// --- INTERFAZ HTML DEL EDITOR ---
function renderPanelEdicion() {
    const panel = document.getElementById('panel-edicion-avanzada');
    if (!panel) return;

    const afinidadesExistentes = new Set();
    estadoMapa.nodos.forEach(n => { if (n.afinidad && n.afinidad !== '-') afinidadesExistentes.add(n.afinidad); });

    let dataListHTML = `<datalist id="dl-edit-afinidad">`;
    afinidadesExistentes.forEach(a => dataListHTML += `<option value="${a}">`);
    dataListHTML += `</datalist>`;

    let html = `${dataListHTML}
                <button onclick="window.mapaEditor.desactivar()" title="Cerrar Editor" style="position:absolute; top:15px; right:15px; width:28px; height:28px; background:rgba(220,20,60,0.5); color:#fff; border:1px solid rgba(255,255,255,0.4); border-radius:50%; font-weight:bold; cursor:pointer; z-index:50;">✕</button>
                <div style="position:sticky; top:0; background:rgba(10,0,20,0.95); z-index:10; padding-bottom:15px; border-bottom:1px dashed #555;">
                    <h3 style="color:var(--gold); text-align:center; font-family:'Cinzel'; margin:0 0 15px 0; padding-right:20px;">⚙️ EDITOR ESTRUCTURAL</h3>
                    
                    <div style="display:flex; justify-content:center; gap:20px; margin-bottom: 15px;">
                        <button onclick="window.mapaEditor.setHerramienta('cursor')" style="width:85px; height:85px; border-radius:12px; background:${editor.herramienta==='cursor' ? 'var(--cyan-magic)' : '#111'}; color:${editor.herramienta==='cursor' ? '#000' : 'var(--cyan-magic)'}; border:2px solid var(--cyan-magic); cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; transition:0.2s; box-shadow: ${editor.herramienta==='cursor' ? '0 0 15px rgba(0,255,255,0.5)' : 'none'};">
                            <span style="font-size:2em; margin-bottom:5px;">👆</span>
                            <span style="font-family:'Cinzel'; font-weight:bold; font-size:0.8em;">Select</span>
                        </button>
                        <button onclick="window.mapaEditor.setHerramienta('enlace')" style="width:85px; height:85px; border-radius:12px; background:${editor.herramienta==='enlace' ? 'var(--cyan-magic)' : '#111'}; color:${editor.herramienta==='enlace' ? '#000' : 'var(--cyan-magic)'}; border:2px solid var(--cyan-magic); cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; transition:0.2s; box-shadow: ${editor.herramienta==='enlace' ? '0 0 15px rgba(0,255,255,0.5)' : 'none'};" title="SHIFT + Soltar para conectar a varios">
                            <span style="font-size:2em; margin-bottom:5px;">↗️</span>
                            <span style="font-family:'Cinzel'; font-weight:bold; font-size:0.8em;">Flecha</span>
                        </button>
                    </div>
                    <button onclick="window.crearNodoNuevo()" style="width:100%; background:linear-gradient(135deg, #004a00, #008000); color:#fff; border:1px solid #00ff00; border-radius:6px; padding:12px; font-weight:bold; font-size:1.1em; cursor:pointer;">➕ Crear Nodo Nuevo Aquí</button>
                </div>`;

    const cands = Array.from(editor.seleccionMultiple);
    
    if (cands.length === 0) {
        html += `<div style="padding:20px; text-align:center; color:#888;">
                    <p style="font-size:0.95em; line-height:1.6;">Haz clic en cualquier nodo para editarlo.</p>
                    <p style="font-size:0.85em; line-height:1.6;">Mantén pulsado <strong style="color:var(--gold);">SHIFT y arrastra</strong> en el fondo para encerrar múltiples nodos en una caja.</p>
                 </div>`;
    } 
    else if (cands.length > 1) {
        html += `<h4 style="color:var(--cyan-magic); text-align:center; font-family:'Cinzel'; margin-top:20px;">Edición Masiva (${cands.length} nodos)</h4>
                 <div style="display:grid; grid-template-columns:1fr; gap:15px; padding:0 5px;">
                    <div><label style="font-size:0.8em; color:#aaa; font-weight:bold;">FORZAR COSTO HEX:</label><input type="number" step="50" onchange="window.actualizarDatoNodo('hex', parseInt(this.value))" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:10px;"></div>
                    <div><label style="font-size:0.8em; color:#aaa; font-weight:bold;">FORZAR CLASE:</label><select onchange="window.actualizarDatoNodo('clase', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:10px;">
                        <option value="">- Ignorar -</option><option value="Clase 1">Clase 1</option><option value="Clase 2">Clase 2</option><option value="Clase 3">Clase 3</option><option value="Clase 4">Clase 4</option><option value="Clase 5">Clase 5</option>
                    </select></div>
                    <div><label style="font-size:0.8em; color:#aaa; font-weight:bold;">FORZAR AFINIDAD:</label><input type="text" list="dl-edit-afinidad" placeholder="- Escribe o Selecciona -" onchange="window.actualizarDatoNodo('afinidad', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:10px;"></div>
                 </div>
                 <button onclick="window.eliminarSeleccion()" style="width:100%; background:#4a0000; border:1px solid #ff0000; border-radius:6px; color:white; padding:12px; font-weight:bold; margin-top:25px; cursor:pointer;">🗑️ DESTRUIR SELECCIÓN</button>`;
    } 
    else {
        const n = cands[0];
        html += `<h4 style="color:var(--cyan-magic); text-align:center; font-family:'Cinzel'; margin-top:20px;">Propiedades de Nodo</h4>
                 <div style="display:flex; flex-direction:column; gap:12px; font-size:0.85em; padding:0 5px;">
                    <div><label style="color:#aaa; font-weight:bold;">ID Excel:</label><input type="text" value="${n.id}" onchange="window.actualizarDatoNodo('id', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px;"></div>
                    <div><label style="color:#aaa; font-weight:bold;">Nombre Visible:</label><input type="text" value="${n.nombreOriginal}" onchange="window.actualizarDatoNodo('nombreOriginal', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px;"></div>
                    
                    <div style="display:flex; gap:10px;">
                        <div style="flex:1;"><label style="color:#aaa; font-weight:bold;">Costo HEX:</label><input type="number" step="50" value="${n.hex}" onchange="window.actualizarDatoNodo('hex', parseInt(this.value))" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px;"></div>
                        <div style="flex:1;"><label style="color:#aaa; font-weight:bold;">Clase:</label><select onchange="window.actualizarDatoNodo('clase', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px;">
                            <option value="Clase 1" ${n.clase==='Clase 1'?'selected':''}>Clase 1</option><option value="Clase 2" ${n.clase==='Clase 2'?'selected':''}>Clase 2</option><option value="Clase 3" ${n.clase==='Clase 3'?'selected':''}>Clase 3</option><option value="Clase 4" ${n.clase==='Clase 4'?'selected':''}>Clase 4</option><option value="Clase 5" ${n.clase==='Clase 5'?'selected':''}>Clase 5</option>
                        </select></div>
                    </div>
                    
                    <div><label style="color:#aaa; font-weight:bold;">Afinidad (Infinita):</label><input type="text" list="dl-edit-afinidad" value="${n.afinidad}" onchange="window.actualizarDatoNodo('afinidad', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px;"></div>

                    <div><label style="color:#aaa; font-weight:bold;">Resumen Breve:</label><textarea onchange="window.actualizarDatoNodo('resumen', this.value)" style="width:100%; box-sizing:border-box; height:45px; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px; resize:none;">${n.resumen}</textarea></div>
                    <div><label style="color:#aaa; font-weight:bold;">Efecto Mecánico:</label><textarea onchange="window.actualizarDatoNodo('efecto', this.value)" style="width:100%; box-sizing:border-box; height:60px; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px; resize:none;">${n.efecto}</textarea></div>
                    
                    <div><label style="color:#ff7777; font-weight:bold;">Overcast (Doble Dado):</label><input type="text" value="${n.overcast}" onchange="window.actualizarDatoNodo('overcast', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px;"></div>
                    <div><label style="color:#77aaff; font-weight:bold;">Undercast (Medio Dado):</label><input type="text" value="${n.undercast}" onchange="window.actualizarDatoNodo('undercast', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px;"></div>
                    <div><label style="color:var(--gold); font-weight:bold;">Regla Especial:</label><input type="text" value="${n.especial}" onchange="window.actualizarDatoNodo('especial', this.value)" style="width:100%; box-sizing:border-box; background:#000; color:#fff; border:1px solid #555; border-radius:4px; padding:8px;"></div>
                 </div>
                 <button onclick="window.eliminarSeleccion()" style="width:100%; background:#4a0000; border:1px solid #ff0000; border-radius:6px; color:white; padding:12px; font-weight:bold; margin-top:20px; cursor:pointer;">🗑️ DESTRUIR NODO</button>`;
    }

    // --- GESTOR DE COLORES EN TIEMPO REAL ---
    html += `<hr style="border-color:#444; margin-top:25px;">
             <details style="background:rgba(0,0,0,0.4); padding:12px; border-radius:8px; border:1px dashed #555;">
                <summary style="color:var(--gold); cursor:pointer; font-size:0.9em; font-weight:bold; font-family:'Cinzel';">🎨 GESTOR DE COLORES DE AFINIDAD</summary>
                <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-top:12px;">`;
    
    afinidadesExistentes.forEach(af => {
        const c = window.mapaColores[af] ? window.mapaColores[af].t : '#ffffff';
        html += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85em; background:#000; padding:5px 10px; border-radius:4px; border:1px solid #333;">
                    <span style="color:#ddd; font-weight:bold;">${af}</span>
                    <input type="color" value="${c}" onchange="window.actualizarColorPersonalizado('${af}', this.value)" style="background:none; border:none; width:30px; height:30px; cursor:pointer; padding:0;">
                 </div>`;
    });
    html += `   </div></details>`;

    html += `<button id="btn-save-editor" onclick="window.guardarEdicionAvanzada()" style="width:100%; background:linear-gradient(135deg, #b8860b, #d4af37); border-radius:8px; color:black; font-weight:bold; padding:18px; margin-top:25px; margin-bottom:20px; font-size:1.2em; border:none; box-shadow: 0 0 15px rgba(212,175,55,0.4); cursor:pointer;">💾 GUARDAR ESTRUCTURA</button>`;
    
    panel.innerHTML = html;
}
