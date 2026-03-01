import { invGlobal, objGlobal, historial, estadoUI } from './obj-state.js';
import { cargarTodoDesdeCSV } from './obj-data.js';
import { modificar, descargarLog, importarLog, descargarEstadoCSV, descargarInventariosJPG, agregarObjetoManual } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP, dibujarCreacionObjeto } from './obj-ui.js';
async function iniciar() {
    const cache = localStorage.getItem('hex_obj_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else { const p = JSON.parse(cache); Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj); historial.push(...(p.his || [])); }
    const _session = 'Y2FuZXk=';
    window.copyToClipboard = (id) => { const area = document.getElementById(id); area.select(); document.execCommand('copy'); };
    window.updateCreationLog = () => {
        const n = document.getElementById('new-obj-name').value || "Objeto"; const e = document.getElementById('new-obj-eff').value || "Efecto";
        let l = []; document.querySelectorAll('.cant-input').forEach(i => {
            const c = parseInt(i.value) || 0; if (c > 0) l.push(`<${i.dataset.player} | OO: ${n}${c > 1 ? ' x'+c : ''} | ${e}`);
        });
        document.getElementById('copy-log-crea').value = l.join('\n');
    };
    window.ejecutarSyncLog = () => {
        if (estadoUI.esAdmin) { dibujarMenuOP(); window.mostrarPagina('op-menu'); return; }
        const i = prompt("System Validation Code:");
        if (i === atob(_session)) { estadoUI.esAdmin = true; dibujarMenuOP(); window.mostrarPagina('op-menu'); } else alert("Error de redundancia.");
    };
    window.mostrarCreacionObjeto = () => { window.mostrarPagina('control'); dibujarCreacionObjeto(); };
    window.ejecutarAgregarObjeto = () => {
        const datos = { nombre: document.getElementById('new-obj-name').value.trim(), tipo: document.getElementById('new-obj-tipo').value, mat: document.getElementById('new-obj-mat').value, eff: document.getElementById('new-obj-eff').value.trim(), rar: document.getElementById('new-obj-rar').value };
        const rep = {}; document.querySelectorAll('.cant-input').forEach(i => rep[i.dataset.player] = i.value);
        agregarObjetoManual(datos, rep, () => { dibujarMenuOP(); window.mostrarPagina('op-menu'); });
    };
    window.setBusqueda = (v) => { estadoUI.busquedaOP = v; refrescarUI(); };
    window.setBusquedaCat = (v) => { estadoUI.busquedaCat = v; refrescarUI(); };
    window.setBusquedaInv = (v) => { estadoUI.busquedaInv = v; refrescarUI(); };
    window.actualizarTodo = () => { if(confirm("¿Actualizar?")) { localStorage.clear(); location.reload(); } };
    window.mostrarPagina = (id) => { estadoUI.busquedaCat = ""; estadoUI.busquedaInv = ""; document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none'); document.getElementById('pag-' + id).style.display = 'block'; refrescarUI(); };
    window.hexMod = (j, o, c) => { estadoUI.logCopy = `<${j} | ${c > 0 ? "OO" : "OP"}: ${o} | ${objGlobal[o]?.eff || "Sin efecto"}`; modificar(j, o, c, refrescarUI); };
    window.setInv = (j) => { estadoUI.jugadorInv = j; refrescarUI(); };
    window.setCtrl = (j) => { estadoUI.jugadorControl = j; refrescarUI(); };
    window.setRar = (r) => { estadoUI.filtroRar = r; refrescarUI(); };
    window.setMat = (m) => { estadoUI.filtroMat = m; refrescarUI(); };
    window.descargarEstadoCSV = descargarEstadoCSV; window.descargarInventariosJPG = descargarInventariosJPG; window.descargarLog = descargarLog;
    window.subirLogManual = () => document.getElementById('input-log').click();
    document.getElementById('input-log')?.addEventListener('change', (e) => { const reader = new FileReader(); reader.onload = (ev) => importarLog(ev.target.result, refrescarUI); reader.readAsText(e.target.files[0]); });
    refrescarUI();
}
iniciar();
