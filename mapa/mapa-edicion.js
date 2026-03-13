import { estadoMapa } from './mapa-state.js';
import { API_HECHIZOS, actualizarColoresFlechas } from './mapa-data.js';

const editor = {
    activa: false,
    seleccionMultiple: new Set(),
    herramienta: 'cursor', // 'cursor' para mover/editar, 'enlace' para crear flechas
    tempLink: null,
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
        document.getElementById('panel-info').classList.add('oculto'); // Oculta el panel normal de ver
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
    editor.herramienta = 'cursor';
};

editor.setHerramienta = (herr) => {
    editor.herramienta = herr;
    renderPanelEdicion();
};

// --- INTERACCIÓN CON RATÓN Y SHIFT PARA MULTI-SELECCIÓN ---
editor.onMouseDown = (e, nodo, worldPos) => {
    if (editor.herramienta === 'enlace') {
        if (nodo) {
            // Empezar a trazar una flecha desde el centro del nodo origen
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
            estadoMapa.interaccion.draggedNode = nodo; // Para mover en grupo
        } else {
            editor.seleccionMultiple.clear();
            estadoMapa.interaccion.isDraggingBg = true;
        }
        renderPanelEdicion();
    }
};

editor.onMouseMove = (e, dx, dy, worldPos) => {
    if (editor.tempLink) {
        // La punta de la flecha sigue al ratón
        editor.tempLink.endX = worldPos.x;
        editor.tempLink.endY = worldPos.y;
    } else if (estadoMapa.interaccion.draggedNode) {
        // Mover todos los nodos seleccionados al mismo tiempo
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
    if (editor.tempLink) {
        if (nodo && nodo !== editor.tempLink.source) {
            crearEnlace(editor.tempLink.source, nodo);
        }
        editor.tempLink = null;
    }
    estadoMapa.interaccion.isDraggingBg = false;
    estadoMapa.interaccion.draggedNode = null;
};

// --- CREACIÓN DE ELEMENTOS ---
window.crearNodoNuevo = () => {
    const idNum = Math.floor(Math.random() * 90000) + 10000;
    const nuevo = {
        id: `Hechizo ${idNum}`,
        nombreOriginal: `Nuevo Hechizo ${idNum}`,
        nombre: `Nuevo Hechizo ${idNum} (0)`,
        afinidad: 'Física',
        clase: 'Clase 1',
        hex: 0,
        resumen: '', efecto: '', overcast: '', undercast: '', especial: '',
        esConocido: false, isHexNode: false,
        x: ((window.innerWidth/2) - estadoMapa.camara.x) / estadoMapa.camara.zoom, // Aparece en el centro exacto de la pantalla
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
    if (estadoMapa.enlaces.some(e => e.source === source && e.target === target)) return; // No duplicar
    
    const newLink = { source, target };
    estadoMapa.enlaces.push(newLink);
    target.incomingSources.push(source);
    
    editor.cambiosPendientes.enlaces.push({ source: source.id, target: target.id, eliminado: false });
    actualizarColoresFlechas();
}

// --- ACTUALIZACIÓN DE DATOS DESDE EL PANEL ---
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

window.eliminarSeleccion = () => {
    if(!confirm("¿Destruir los nodos seleccionados y todas las flechas conectadas a ellos?")) return;
    
    editor.seleccionMultiple.forEach(n => {
        // Cortar todas las flechas que toquen a este nodo
        estadoMapa.enlaces = estadoMapa.enlaces.filter(e => {
            if (e.source === n || e.target === n) {
                editor.cambiosPendientes.enlaces.push({ source: e.source.id, target: e.target.id, eliminado: true });
                return false;
            }
            return true;
        });
        
        // Quitar de los registros de padres
        estadoMapa.nodos.forEach(other => {
            other.incomingSources = other.incomingSources.filter(s => s !== n);
        });

        // Borrar el nodo del mapa visual
        estadoMapa.nodos = estadoMapa.nodos.filter(x => x !== n);
        
        // Añadir a la cola para borrarlo en Google Sheets
        editor.cambiosPendientes.nodos[n.id] = { idOriginal: n.id, eliminado: true };
    });
    
    editor.seleccionMultiple.clear();
    actualizarColoresFlechas();
    renderPanelEdicion();
};

window.guardarEdicionAvanzada = async () => {
    // Si la persona solo movió nodos y nunca les cambió el texto, los registramos para que se guarde su nueva (X, Y)
    estadoMapa.nodos.forEach(n => {
        if(n.modificado) registrarCambioNodo(n);
    });

    const payload = {
        accion: 'guardar_edicion_completa',
        nodos: Object.values(editor.cambiosPendientes.nodos),
        enlaces: editor.cambiosPendientes.enlaces
    };

    if (payload.nodos.length === 0 && payload.enlaces.length === 0) return alert("No has hecho ningún cambio estructural aún.");

    const btn = document.getElementById('btn-save-editor');
    btn.innerText = "Sincronizando Estructura..."; btn.disabled = true;

    try {
        const res = await fetch(API_HECHIZOS, { method: 'POST', body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.status === 'success') {
            alert("¡Mapa guardado exitosamente en Google Sheets!");
            editor.cambiosPendientes = { nodos: {}, enlaces: [] };
            estadoMapa.nodos.forEach(n => { n.modificado = false; n._esNuevo = false; n._oldId = n.id; });
        } else {
            alert("Fallo del servidor: " + data.message);
        }
    } catch(e) { alert("Google bloqueó la subida. Verifica tu conexión."); }
    
    btn.innerText = "💾 GUARDAR ESTRUCTURA"; btn.disabled = false;
};

// --- INTERFAZ HTML DE LA BARRA LATERAL ---
function renderPanelEdicion() {
    const panel = document.getElementById('panel-edicion-avanzada');
    if (!panel) return;

    let html = `<h3 style="color:#00ffff; text-align:center; font-family:'Cinzel'; border-bottom:1px solid #00ffff; padding-bottom:10px;">Herramientas</h3>
                
                <div style="display:flex; gap:10px; margin-bottom: 20px;">
                    <button onclick="window.mapaEditor.setHerramienta('cursor')" style="flex:1; background:${editor.herramienta==='cursor' ? '#00ffff' : '#222'}; color:${editor.herramienta==='cursor' ? '#000' : '#fff'}; border:1px solid #00ffff;">👆 Seleccionar</button>
                    <button onclick="window.mapaEditor.setHerramienta('enlace')" style="flex:1; background:${editor.herramienta==='enlace' ? '#00ffff' : '#222'}; color:${editor.herramienta==='enlace' ? '#000' : '#fff'}; border:1px solid #00ffff;" title="Clic en un Nodo y arrastra hacia otro para conectarlos">↗️ Flecha</button>
                </div>
                <button onclick="window.crearNodoNuevo()" style="width:100%; background:#004a00; color:#fff; border:1px solid #00ff00; padding:10px; margin-bottom:20px;">➕ Crear Nodo Nuevo Aquí</button>
                <hr style="border-color:#444;">`;

    const cands = Array.from(editor.seleccionMultiple);
    
    if (cands.length === 0) {
        html += `<p style="color:#888; text-align:center; font-size:0.9em; margin-top:20px; line-height: 1.5;"><i>Haz clic en cualquier nodo para editarlo.<br><br>Mantén pulsado <b>SHIFT</b> y haz clic en varios para editarlos o moverlos en grupo.</i></p>`;
    } 
    else if (cands.length > 1) {
        html += `<h4 style="color:var(--gold); text-align:center;">Edición Masiva (${cands.length} nodos)</h4>
                 <div style="display:grid; grid-template-columns:1fr; gap:10px;">
                    <div><label style="font-size:0.8em; color:#aaa;">Forzar Costo HEX:</label><input type="number" onchange="window.actualizarDatoNodo('hex', parseInt(this.value))" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;"></div>
                    <div><label style="font-size:0.8em; color:#aaa;">Forzar Afinidad:</label><select onchange="window.actualizarDatoNodo('afinidad', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;">
                        <option value="">- Ignorar -</option><option>Física</option><option>Energética</option><option>Espiritual</option><option>Mando</option><option>Psíquica</option><option>Oscura</option>
                    </select></div>
                 </div>
                 <button onclick="window.eliminarSeleccion()" style="width:100%; background:#4a0000; border:1px solid #ff0000; color:white; padding:10px; margin-top:20px;">🗑️ Destruir Todos</button>`;
    } 
    else {
        const n = cands[0];
        html += `<h4 style="color:var(--gold); text-align:center; margin-top:0;">Propiedades de Nodo</h4>
                 <div style="display:flex; flex-direction:column; gap:8px; font-size:0.85em;">
                    <div><label style="color:#aaa;">ID Excel (Hechizo 24):</label><input type="text" value="${n.id}" onchange="window.actualizarDatoNodo('id', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;"></div>
                    <div><label style="color:#aaa;">Nombre del Hechizo:</label><input type="text" value="${n.nombreOriginal}" onchange="window.actualizarDatoNodo('nombreOriginal', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;"></div>
                    
                    <div style="display:flex; gap:10px;">
                        <div style="flex:1;"><label style="color:#aaa;">Costo HEX:</label><input type="number" value="${n.hex}" onchange="window.actualizarDatoNodo('hex', parseInt(this.value))" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;"></div>
                        <div style="flex:1;"><label style="color:#aaa;">Clase:</label><input type="text" value="${n.clase}" onchange="window.actualizarDatoNodo('clase', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;"></div>
                    </div>
                    
                    <div><label style="color:#aaa;">Afinidad:</label><select onchange="window.actualizarDatoNodo('afinidad', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;">
                        <option value="Física" ${n.afinidad==='Física'?'selected':''}>Física</option>
                        <option value="Energética" ${n.afinidad==='Energética'?'selected':''}>Energética</option>
                        <option value="Espiritual" ${n.afinidad==='Espiritual'?'selected':''}>Espiritual</option>
                        <option value="Mando" ${n.afinidad==='Mando'?'selected':''}>Mando</option>
                        <option value="Psíquica" ${n.afinidad==='Psíquica'?'selected':''}>Psíquica</option>
                        <option value="Oscura" ${n.afinidad==='Oscura'?'selected':''}>Oscura</option>
                    </select></div>

                    <div><label style="color:#aaa;">Resumen Breve:</label><textarea onchange="window.actualizarDatoNodo('resumen', this.value)" style="width:100%; height:40px; background:#000; color:#fff; border:1px solid #555; padding:5px; resize:none;">${n.resumen}</textarea></div>
                    <div><label style="color:#aaa;">Efecto Mecánico:</label><textarea onchange="window.actualizarDatoNodo('efecto', this.value)" style="width:100%; height:50px; background:#000; color:#fff; border:1px solid #555; padding:5px; resize:none;">${n.efecto}</textarea></div>
                    
                    <div><label style="color:#ff7777;">Overcast (Doble Dado):</label><input type="text" value="${n.overcast}" onchange="window.actualizarDatoNodo('overcast', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;"></div>
                    <div><label style="color:#77aaff;">Undercast (Medio Dado):</label><input type="text" value="${n.undercast}" onchange="window.actualizarDatoNodo('undercast', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;"></div>
                    <div><label style="color:var(--gold);">Regla Especial:</label><input type="text" value="${n.especial}" onchange="window.actualizarDatoNodo('especial', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid #555; padding:5px;"></div>
                 </div>
                 <button onclick="window.eliminarSeleccion()" style="width:100%; background:#4a0000; border:1px solid #ff0000; color:white; padding:10px; margin-top:15px;">🗑️ Destruir Nodo</button>`;
    }

    html += `<button id="btn-save-editor" onclick="window.guardarEdicionAvanzada()" style="width:100%; background:linear-gradient(135deg, #b8860b, #d4af37); color:black; font-weight:bold; padding:15px; margin-top:25px; font-size:1.1em; border:none; box-shadow: 0 0 15px rgba(212,175,55,0.4); cursor:pointer;">💾 GUARDAR ESTRUCTURA</button>`;
    
    panel.innerHTML = html;
}
