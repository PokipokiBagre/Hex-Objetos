import { estadoUI, db } from './inventario-state.js';
import { inicializarDatos, sincronizarColaBD, exportarCSVPersonajes } from './inventario-data.js';
import { dibujarCatalogo, renderHeaders, dibujarGrimorioGrid, dibujarGestionGrid, dibujarAprendizajeGrid } from './inventario-ui.js';

window.onload = async () => {
    const ok = await inicializarDatos();
    if(!ok) return document.getElementById('loader').innerHTML = "<span style='color:red'>Fallo Crítico al cargar Servidores.</span>";
    document.getElementById('loader').style.display = 'none';
    window.cambiarVista('catalogo');
};

window.cambiarVista = (vista) => {
    estadoUI.vistaActual = vista;
    document.querySelectorAll('.vista-seccion').forEach(el => el.classList.add('oculto'));
    document.getElementById(`c-${vista}`).classList.remove('oculto');
    
    if (vista === 'catalogo') dibujarCatalogo(); 
    else {
        renderHeaders(); 
        if (vista === 'grimorio') dibujarGrimorioGrid();
        if (vista === 'gestion') dibujarGestionGrid();
        if (vista === 'aprendizaje') dibujarAprendizajeGrid();
    }
    actualizarBotonSync();
};

window.abrirGrimorio = (pj) => { estadoUI.personajeSeleccionado = pj; estadoUI.filtrosGrimorio = { afinidad: 'Todos', busqueda: '' }; window.cambiarVista('grimorio'); };
window.abrirMenuOP = () => {
    if(estadoUI.esAdmin) { estadoUI.esAdmin = false; alert("Modo OP Desactivado."); window.cambiarVista('catalogo'); return; }
    if (prompt("Contraseña:") === atob('Y2FuZXk=')) { estadoUI.esAdmin = true; alert("Modo OP Activado."); window.cambiarVista(estadoUI.vistaActual); }
};

window.setFiltro = (tipo, valor) => {
    if(tipo === 'rol') { estadoUI.filtroRol = valor; ['Todos','Jugador','NPC'].forEach(k => document.getElementById('btn-rol-'+k).classList.remove('btn-active')); document.getElementById('btn-rol-'+valor).classList.add('btn-active'); }
    if(tipo === 'act') { estadoUI.filtroAct = valor; ['Todos','Activo','Inactivo'].forEach(k => document.getElementById('btn-act-'+k).classList.remove('btn-active')); document.getElementById('btn-act-'+valor).classList.add('btn-active'); }
    dibujarCatalogo();
};

window.aplicarFiltrosGrimorio = () => { estadoUI.filtrosGrimorio.afinidad = document.getElementById('f-grim-afinidad').value; estadoUI.filtrosGrimorio.busqueda = document.getElementById('f-grim-texto').value; dibujarGrimorioGrid(); };
window.aplicarFiltrosGestion = () => { estadoUI.filtrosGestion.afinidad = document.getElementById('op-f-afinidad').value; estadoUI.filtrosGestion.clase = document.getElementById('op-f-clase').value; estadoUI.filtrosGestion.busqueda = document.getElementById('op-f-texto').value; dibujarGestionGrid(); };
window.toggleRestarHex = (c) => { estadoUI.restarHexAsignacion = c; };
window.descargarCSVHex = () => { exportarCSVPersonajes(); };

// --- MAGIA: SUMA AFINIDADES (+1 Total y +1 Conteo) ---
function aplicarCambiosPersonaje(pj, hex, afinidad) {
    const charObj = db.personajes[pj];
    charObj.hex = Math.max(0, charObj.hex - hex); 
    
    const colMap = { 'Física': 3, 'Energética': 4, 'Espiritual': 5, 'Mando': 6, 'Psíquica': 7, 'Oscura': 8 };
    if (colMap[afinidad]) {
        const idx = colMap[afinidad];
        let cell = charObj.rawRow[idx];
        if (!cell || !cell.includes('_')) cell = `${cell || 0}_0_0_0_0`;
        let parts = cell.split('_');
        
        parts[0] = (parseInt(parts[0]) + 1).toString(); // +1 al Total
        if(parts.length > 2) parts[2] = (parseInt(parts[2]) + 1).toString(); // +1 al Conteo (Spells)
        
        charObj.rawRow[idx] = parts.join('_');
    }
    const hexParts = charObj.rawRow[1].split('_'); hexParts[0] = charObj.hex.toString(); charObj.rawRow[1] = hexParts.join('_');
}

window.aprenderDelArbol = (nombreHechizo, afinidad, hex) => {
    window.accionCola('agregar', nombreHechizo, afinidad, hex, 'Mapa Hex', true);
    window.cambiarVista('grimorio');
};

window.accionCola = (accion, nombreHechizo, afinidad = '', hex = 0, origenAuto = null, estadoConocido = null) => {
    const pj = estadoUI.personajeSeleccionado;
    
    if(accion === 'agregar') {
        const origen = origenAuto || document.getElementById('slicer-origen')?.value || 'OP Admin';
        estadoUI.colaCambios.agregar.push([pj, nombreHechizo, afinidad, hex, "Normal", origen]);
        if(estadoUI.restarHexAsignacion || origenAuto === 'Mapa Hex') aplicarCambiosPersonaje(pj, hex, afinidad);
    } else if (accion === 'quitar') {
        estadoUI.colaCambios.quitar.push({ Personaje: pj, Hechizo: nombreHechizo });
    } else if (accion === 'toggle_conocido') {
        estadoUI.colaCambios.toggleConocido.push({ Hechizo: nombreHechizo, Estado: estadoConocido });
    }
    
    if(estadoUI.vistaActual === 'gestion') { dibujarGestionGrid(); }
    actualizarBotonSync();
};

function actualizarBotonSync() {
    const btn = document.getElementById('btn-sync-global');
    const h = estadoUI.colaCambios.agregar.length + estadoUI.colaCambios.quitar.length + estadoUI.colaCambios.toggleConocido.length;
    if (h > 0) { btn.classList.remove('oculto'); btn.innerText = `🔥 GUARDAR CAMBIOS AL SERVIDOR (${h}) 🔥`; } 
    else btn.classList.add('oculto');
}

window.ejecutarSincronizacion = async () => {
    const btn = document.getElementById('btn-sync-global'); btn.innerText = "Sincronizando..."; btn.disabled = true;
    if(await sincronizarColaBD(estadoUI.colaCambios)) {
        alert("¡Base de datos actualizada con éxito!"); estadoUI.colaCambios = { agregar: [], quitar: [], toggleConocido: [] };
        if(estadoUI.restarHexAsignacion && estadoUI.esAdmin) {
            if(confirm("Se actualizaron Afinidades y HEX en la memoria local. ¿Descargar CSV de Estadísticas para subirlo a tu drive?")) exportarCSVPersonajes();
        }
        window.location.reload(); // Forzar recarga limpia
    } else alert("Error de conexión. Reintenta.");
    btn.disabled = false;
};
