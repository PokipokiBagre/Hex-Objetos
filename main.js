import { invGlobal, objGlobal, historial, estadoUI } from './obj-state.js';
import { cargarTodoDesdeCSV } from './obj-data.js';
import { modificar, descargarLog, importarLog, descargarEstadoCSV, descargarInventariosJPG } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP } from './obj-ui.js';

async function iniciar() {
    const cache = localStorage.getItem('hex_obj_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else {
        const p = JSON.parse(cache);
        Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj);
        historial.push(...(p.his || []));
    }
    const _session = 'Y2FuZXk=';
    window.ejecutarSyncLog = () => {
        const i = prompt("System Validation Code:");
        if (estadoUI.esAdmin || i === atob(_session)) {
            estadoUI.esAdmin = true; dibujarMenuOP(); window.mostrarPagina('op-menu');
        } else { alert("Error de redundancia."); }
    };
    window.setBusqueda = (v) => { estadoUI.busquedaOP = v; refrescarUI(); };
    window.setBusquedaCat = (v) => { estadoUI.busquedaCat = v; refrescarUI(); };
    window.setBusquedaInv = (v) => { estadoUI.busquedaInv = v; refrescarUI(); };
    window.actualizarTodo = () => { if(confirm("¿Actualizar sistema?")) { localStorage.clear(); location.reload(); } };
    window.mostrarPagina = (id) => {
        estadoUI.busquedaCat = ""; estadoUI.busquedaInv = "";
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        document.getElementById('pag-' + id).style.display = 'block'; refrescarUI();
    };
    window.hexMod = (j, o, c) => modificar(j, o, c, refrescarUI);
    window.setInv = (j) => { estadoUI.jugadorInv = j; refrescarUI(); };
    window.setCtrl = (j) => { estadoUI.jugadorControl = j; refrescarUI(); };
    window.setRar = (r) => { estadoUI.filtroRar = r; refrescarUI(); };
    window.setMat = (m) => { estadoUI.filtroMat = m; refrescarUI(); };
    window.descargarEstadoCSV = descargarEstadoCSV;
    window.descargarInventariosJPG = descargarInventariosJPG;
    window.descargarLog = descargarLog;
    window.subirLogManual = () => document.getElementById('input-log').click();
    document.getElementById('input-log')?.addEventListener('change', (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => importarLog(ev.target.result, refrescarUI);
        reader.readAsText(e.target.files[0]);
    });
    refrescarUI();
}
iniciar();