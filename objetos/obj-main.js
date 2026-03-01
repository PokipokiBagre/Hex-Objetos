import { invGlobal, objGlobal, historial, estadoUI } from './obj-state.js';
import { cargarTodoDesdeCSV } from './obj-data.js';
import { modificar, descargarLog, descargarEstadoCSV, descargarInventariosJPG, agregarObjetoManual } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP, dibujarCreacionObjeto } from './obj-ui.js';

async function iniciar() {
    // LIMPIEZA AUTOMÁTICA AL RECARGAR
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
        localStorage.removeItem('hex_obj_v4');
        console.log("Caché HEX limpiada por recarga de página.");
    }

    const cache = localStorage.getItem('hex_obj_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else { const p = JSON.parse(cache); Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj); historial.push(...(p.his || [])); }
    
    const _session = 'Y2FuZXk=';

    window.copyToClipboard = (id) => { const area = document.getElementById(id); area.select(); document.execCommand('copy'); };
    window.limpiarLog = () => { estadoUI.cambiosSesion = {}; estadoUI.logCopy = ""; refrescarUI(); };

    window.actualizarBitacoraTexto = () => {
        let lineas = [];
        for (const jug in estadoUI.cambiosSesion) {
            for (const obj in estadoUI.cambiosSesion[jug]) {
                const cant = estadoUI.cambiosSesion[jug][obj]; if (cant === 0) continue;
                lineas.push(`<${jug} | ${cant > 0 ? "OO" : "OP"}: ${obj}${Math.abs(cant) > 1 ? ' x' + Math.abs(cant) : ''} | ${objGlobal[obj]?.eff || "Sin efecto"}>`);
            }
        }
        estadoUI.logCopy = lineas.join('\n'); refrescarUI();
    };

    window.hexMod = (j, o, c) => {
        if (!estadoUI.cambiosSesion[j]) estadoUI.cambiosSesion[j] = {};
        estadoUI.cambiosSesion[j][o] = (estadoUI.cambiosSesion[j][o] || 0) + c;
        if (estadoUI.cambiosSesion[j][o] === 0) delete estadoUI.cambiosSesion[j][o];
        window.actualizarBitacoraTexto(); modificar(j, o, c, refrescarUI);
    };

    window.actualizarTodo = async () => { if(confirm("¿Sincronizar datos?")) { await cargarTodoDesdeCSV(); refrescarUI(); alert("OK"); } };
    
    window.ejecutarSyncLog = () => {
        if (estadoUI.esAdmin) { dibujarMenuOP(); window.mostrarPagina('op-menu'); return; }
        const i = prompt("Code:"); if (i === atob(_session)) { estadoUI.esAdmin = true; dibujarMenuOP(); window.mostrarPagina('op-menu'); }
    };

    // Funciones de navegación y filtros
    window.mostrarPagina = (id) => { document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none'); document.getElementById('pag-' + id).style.display = 'block'; refrescarUI(); };
    window.setInv = (j) => { estadoUI.jugadorInv = j; refrescarUI(); };
    window.setCtrl = (j) => { estadoUI.jugadorControl = j; refrescarUI(); };
    window.setRar = (r) => { estadoUI.filtroRar = r; refrescarUI(); };
    window.setMat = (m) => { estadoUI.filtroMat = m; refrescarUI(); }; // Filtro de material
    
    window.setBusquedaOP = (v) => { estadoUI.busquedaOP = v; refrescarUI(); };
    window.setBusquedaCat = (v) => { estadoUI.busquedaCat = v; refrescarUI(); };
    window.setBusquedaInv = (v) => { estadoUI.busquedaInv = v; refrescarUI(); };
    
    window.descargarEstadoCSV = descargarEstadoCSV; window.descargarInventariosJPG = descargarInventariosJPG; window.descargarLog = descargarLog;
    refrescarUI();
}
iniciar();
