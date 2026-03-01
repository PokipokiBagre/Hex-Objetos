import { invGlobal, objGlobal, historial, estadoUI } from './state.js';
import { cargarTodoDesdeCSV } from './data.js';
import { modificar, descargarLog, importarLog, resetDB, descargarEstadoCSV, descargarInventariosJPG } from './logic.js';
import { refrescarUI, dibujarMenuOP } from './ui.js';

async function iniciar() {
    const cache = localStorage.getItem('hex_db_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else {
        const p = JSON.parse(cache);
        Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj);
        historial.push(...(p.his || []));
    }
    
    document.getElementById('input-log')?.addEventListener('change', (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => importarLog(ev.target.result, refrescarUI);
        reader.readAsText(e.target.files[0]);
    });

    window.validarOP = () => {
        const secret = 'Y2FuZXk=';
        if (estadoUI.esAdmin || prompt("Contraseña:") === atob(secret)) {
            estadoUI.esAdmin = true; dibujarMenuOP(); window.mostrarPagina('op-menu');
        } else { alert("ACCESO DENEGADO"); }
    };

    window.mostrarPagina = (id) => {
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        document.getElementById('pag-' + id).style.display = 'block';
    };

    window.hexMod = (j, o, c) => modificar(j, o, c, refrescarUI);
    window.setInv = (j) => { estadoUI.jugadorInv = j; refrescarUI(); };
    window.setCtrl = (j) => { estadoUI.jugadorControl = j; refrescarUI(); };
    window.setRar = (r) => { estadoUI.filtroRar = r; refrescarUI(); };
    window.setMat = (m) => { estadoUI.filtroMat = m; refrescarUI(); };
    window.descargarEstadoCSV = descargarEstadoCSV;
    window.descargarInventariosJPG = descargarInventariosJPG;
    window.descargarLog = descargarLog;
    window.reset = resetDB;
    window.subirLogManual = () => document.getElementById('input-log').click();
    window.sincronizarSheet = async () => { await cargarTodoDesdeCSV(); refrescarUI(); alert("SINCRONIZADO"); };

    refrescarUI();
}
iniciar();
