import { invGlobal, objGlobal, historial, estadoUI } from './obj-state.js';
import { cargarTodoDesdeCSV } from './obj-data.js';
import { modificar, descargarLog, descargarEstadoCSV, descargarInventariosJPG } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP } from './obj-ui.js';

async function iniciar() {
    // Forzar limpieza al refrescar la página
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
        localStorage.removeItem('hex_obj_v4');
    }

    const cache = localStorage.getItem('hex_obj_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else { const p = JSON.parse(cache); Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj); historial.push(...(p.his || [])); }
    
    const _session = 'Y2FuZXk=';

    window.copyToClipboard = (id) => { const area = document.getElementById(id); area.select(); document.execCommand('copy'); };
    window.limpiarLog = () => { estadoUI.cambiosSesion = {}; estadoUI.logCopy = ""; refrescarUI(); };
    window.actualizarBitacoraTexto = () => {
        let lines = [];
        for (const j in estadoUI.cambiosSesion) {
            for (const o in estadoUI.cambiosSesion[j]) {
                const c = estadoUI.cambiosSesion[j][o]; if (c === 0) continue;
                lines.push(`<${j} | ${c > 0 ? "OO" : "OP"}: ${o}${Math.abs(c) > 1 ? ' x' + Math.abs(c) : ''} | ${objGlobal[o]?.eff || "..."}>`);
            }
        }
        estadoUI.logCopy = lines.join('\n'); refrescarUI();
    };

    window.hexMod = (j, o, c) => {
        if (!estadoUI.cambiosSesion[j]) estadoUI.cambiosSesion[j] = {};
        estadoUI.cambiosSesion[j][o] = (estadoUI.cambiosSesion[j][o] || 0) + c;
        if (estadoUI.cambiosSesion[j][o] === 0) delete estadoUI.cambiosSesion[j][o];
        window.actualizarBitacoraTexto(); modificar(j, o, c, refrescarUI);
    };

    window.actualizarTodo = async () => { if(confirm("¿Sincronizar?")) { await cargarTodoDesdeCSV(); refrescarUI(); alert("OK"); } };
    window.ejecutarSyncLog = () => {
        if (estadoUI.esAdmin) { dibujarMenuOP(); window.mostrarPagina('op-menu'); return; }
        const i = prompt("System Code:"); if (i === atob(_session)) { estadoUI.esAdmin = true; dibujarMenuOP(); window.mostrarPagina('op-menu'); }
    };

    // Navegación y Filtros
    window.mostrarPagina = (id) => { document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none'); document.getElementById('pag-' + id).style.display = 'block'; refrescarUI(); };
    window.setInv = (j) => { estadoUI.jugadorInv = j; refrescarUI(); };
    window.setCtrl = (j) => { estadoUI.jugadorControl = j; refrescarUI(); };
    window.setRar = (r) => { estadoUI.filtroRar = r; refrescarUI(); };
    window.setMat = (m) => { estadoUI.filtroMat = m; refrescarUI(); };
    window.setBusquedaInv = (v) => { estadoUI.busquedaInv = v; refrescarUI(); };
    window.setBusquedaCat = (v) => { estadoUI.busquedaCat = v; refrescarUI(); };
    window.setBusquedaOP = (v) => { estadoUI.busquedaOP = v; refrescarUI(); };
    
    window.descargarEstadoCSV = descargarEstadoCSV; window.descargarInventariosJPG = descargarInventariosJPG; window.descargarLog = descargarLog;
    refrescarUI();
}
iniciar();
