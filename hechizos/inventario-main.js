import { estadoUI, db } from './inventario-state.js';
import { inicializarDatos, sincronizarColaBD, exportarCSVPersonajes } from './inventario-data.js';
import { dibujarCatalogo, renderHeaders, dibujarGrimorioGrid, dibujarGestionGrid, dibujarAprendizajeGrid } from './inventario-ui.js';

window.onload = async () => {
    const loader = document.getElementById('loader');
    const ok = await inicializarDatos();
    if(!ok) { if(loader) loader.innerHTML = "<span style='color:red'>Fallo Crítico al cargar Servidores.</span>"; return; }
    if(loader) loader.style.display = 'none';
    window.cambiarVista('catalogo');
};

window.cambiarVista = (vista) => {
    estadoUI.vistaActual = vista;
    document.querySelectorAll('.vista-seccion').forEach(el => el.classList.add('oculto'));
    const sec = document.getElementById(`c-${vista}`);
    if(sec) sec.classList.remove('oculto');
    
    const btnCat = document.getElementById('btn-nav-catalogo');
    if(btnCat) {
        if(vista === 'catalogo') btnCat.classList.add('oculto');
        else btnCat.classList.remove('oculto');
    }

    if (vista === 'catalogo') { dibujarCatalogo(); } 
    else {
        renderHeaders(); 
        if (vista === 'grimorio') dibujarGrimorioGrid();
        if (vista === 'gestion') { actualizarTextoLogOP(); dibujarGestionGrid(); }
        if (vista === 'aprendizaje') dibujarAprendizajeGrid();
    }
    actualizarBotonSync();
};

window.abrirGrimorio = (pj) => { estadoUI.personajeSeleccionado = pj; estadoUI.filtrosGrimorio = { afinidad: 'Todos', busqueda: '' }; window.cambiarVista('grimorio'); window.scrollTo(0,0); };
window.abrirMenuOP = () => {
    if(estadoUI.esAdmin) { estadoUI.esAdmin = false; alert("Modo OP Desactivado."); window.cambiarVista('catalogo'); return; }
    if (prompt("Contraseña:") === atob('Y2FuZXk=')) { estadoUI.esAdmin = true; window.cambiarVista(estadoUI.vistaActual); }
};

window.setFiltro = (tipo, valor) => {
    if(tipo === 'rol') { estadoUI.filtroRol = valor; ['Todos','Jugador','NPC'].forEach(k => document.getElementById('btn-rol-'+k)?.classList.remove('btn-active')); document.getElementById('btn-rol-'+valor)?.classList.add('btn-active'); }
    if(tipo === 'act') { estadoUI.filtroAct = valor; ['Todos','Activo','Inactivo'].forEach(k => document.getElementById('btn-act-'+k)?.classList.remove('btn-active')); document.getElementById('btn-act-'+valor)?.classList.add('btn-active'); }
    dibujarCatalogo();
};

window.aplicarFiltrosGrimorio = () => { estadoUI.filtrosGrimorio.afinidad = document.getElementById('f-grim-afinidad').value; estadoUI.filtrosGrimorio.busqueda = document.getElementById('f-grim-texto').value; dibujarGrimorioGrid(); };
window.aplicarFiltrosGestion = () => { estadoUI.filtrosGestion.afinidad = document.getElementById('op-f-afinidad').value; estadoUI.filtrosGestion.clase = document.getElementById('op-f-clase').value; estadoUI.filtrosGestion.busqueda = document.getElementById('op-f-texto').value; dibujarGestionGrid(); };
window.aplicarFiltrosAprendizaje = () => { estadoUI.filtrosAprendizaje.afinidad = document.getElementById('f-apr-afinidad').value; estadoUI.filtrosAprendizaje.clase = document.getElementById('f-apr-clase').value; estadoUI.filtrosAprendizaje.busqueda = document.getElementById('f-apr-texto').value; dibujarAprendizajeGrid(); };

window.toggleRestarHex = (c) => { estadoUI.restarHexAsignacion = c; };
window.descargarCSVHex = () => { exportarCSVPersonajes(); };

// --- LÓGICA DE AFINIDAD Y HEX ---
function aplicarCambiosPersonaje(pj, hex, afinidad) {
    const charObj = db.personajes[pj];
    charObj.hex = Math.max(0, charObj.hex - hex); 
    
    const colMap = { 'Física': 3, 'Energética': 4, 'Espiritual': 5, 'Mando': 6, 'Psíquica': 7, 'Oscura': 8 };
    if (colMap[afinidad]) {
        const idx = colMap[afinidad];
        let cell = charObj.rawRow[idx];
        if (!cell || !cell.includes('_')) cell = `${cell || 0}_0_0_0_0`;
        let parts = cell.split('_');
        parts[0] = (parseInt(parts[0]) + 1).toString(); 
        if(parts.length > 2) parts[2] = (parseInt(parts[2]) + 1).toString(); 
        charObj.rawRow[idx] = parts.join('_');
    }
    const hexParts = charObj.rawRow[1].split('_'); hexParts[0] = charObj.hex.toString(); charObj.rawRow[1] = hexParts.join('_');
}

function actualizarTextoLogOP() {
    const textarea = document.getElementById('op-log-textarea');
    if(!textarea) return;
    const pj = estadoUI.personajeSeleccionado;
    const char = db.personajes[pj];

    let out = "";
    estadoUI.logOP.descubiertos.forEach(d => { out += `Hechizo descubierto: ${d}\n`; });

    if(estadoUI.logOP.aprendidos.length > 0) {
        const list = estadoUI.logOP.aprendidos.join(", ");
        const currentHex = char ? char.hex : 0;
        out += `Hechizo aprendido: ${list} -${estadoUI.logOP.hexGastado} Hex (${currentHex})\n`;
    }
    textarea.value = out;
    textarea.scrollTop = textarea.scrollHeight;
}

window.copiarLogOP = () => {
    const t = document.getElementById('op-log-textarea');
    if(t) { t.select(); document.execCommand('copy'); alert("Log copiado al portapapeles."); }
};
window.limpiarLogOP = () => { estadoUI.logOP = { descubiertos: [], aprendidos: [], hexGastado: 0 }; actualizarTextoLogOP(); };


window.accionCola = (accion, nombreHechizo, afinidad = '', hex = 0, targetVisibility = null) => {
    const pj = estadoUI.personajeSeleccionado;
    const todosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    const info = todosNodos.find(n => n.Nombre === nombreHechizo);
    
    if(accion === 'agregar') {
        const origen = document.getElementById('slicer-origen')?.value || 'OP Admin';
        estadoUI.colaCambios.agregar.push([pj, nombreHechizo, afinidad, hex, "Normal", origen]);
        
        if(estadoUI.restarHexAsignacion) {
            aplicarCambiosPersonaje(pj, hex, afinidad);
            estadoUI.logOP.aprendidos.push(nombreHechizo);
            estadoUI.logOP.hexGastado += hex;
            
            if(info && (!info.Conocido || info.Conocido.toString().trim().toLowerCase() !== 'si')) {
                estadoUI.colaCambios.toggleConocido.push({ Hechizo: nombreHechizo, Estado: 'si' });
                estadoUI.logOP.descubiertos.push(`${info.ID} - ${info.Nombre}`);
            }
        }
    } else if (accion === 'quitar') {
        estadoUI.colaCambios.quitar.push({ Personaje: pj, Hechizo: nombreHechizo });
    } else if (accion === 'toggle_conocido') {
        estadoUI.colaCambios.toggleConocido.push({ Hechizo: nombreHechizo, Estado: targetVisibility });
    }
    
    if(estadoUI.vistaActual === 'gestion') { renderHeaders(); dibujarGestionGrid(); actualizarTextoLogOP(); }
    else if(estadoUI.vistaActual === 'grimorio') { dibujarGrimorioGrid(); } // Refresca si pulsas mostrar/ocultar en el Grimorio
    
    actualizarBotonSync();
};

function actualizarBotonSync() {
    const btn = document.getElementById('btn-sync-global');
    if(!btn) return;
    const h = estadoUI.colaCambios.agregar.length + estadoUI.colaCambios.quitar.length + estadoUI.colaCambios.toggleConocido.length;
    if (h > 0) { btn.classList.remove('oculto'); btn.innerText = `🔥 GUARDAR CAMBIOS AL SERVIDOR (${h}) 🔥`; } 
    else btn.classList.add('oculto');
}

window.ejecutarSincronizacion = async () => {
    const btn = document.getElementById('btn-sync-global'); btn.innerText = "Sincronizando..."; btn.disabled = true;
    if(await sincronizarColaBD(estadoUI.colaCambios)) {
        alert("¡Base de datos actualizada con éxito!"); estadoUI.colaCambios = { agregar: [], quitar: [], toggleConocido: [] };
        if(estadoUI.restarHexAsignacion && estadoUI.esAdmin && estadoUI.logOP.aprendidos.length > 0) {
            if(confirm("El personaje ha modificado su HEX y Afinidad. ¿Descargar el nuevo CSV de estadísticas?")) exportarCSVPersonajes();
        }
        window.location.reload(); 
    } else alert("Error de conexión. Reintenta.");
    btn.disabled = false;
};
