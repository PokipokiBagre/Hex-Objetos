import { invGlobal, objGlobal, historial, estadoUI } from './obj-state.js';
import { cargarTodoDesdeCSV } from './obj-data.js';
import { modificar, descargarLog, importarLog, descargarEstadoCSV, descargarInventariosJPG, agregarObjetoManual } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP, dibujarFormularioObjeto } from './obj-ui.js';

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
            estadoUI.esAdmin = true; 
            dibujarMenuOP(); 
            window.mostrarPagina('op-menu');
        } else { alert("Error de redundancia en el servidor."); }
    };

    window.setBusqueda = (v) => { estadoUI.busquedaOP = v; refrescarUI(); };
    window.setBusquedaCat = (v) => { estadoUI.busquedaCat = v; refrescarUI(); };
    window.setBusquedaInv = (v) => { estadoUI.busquedaInv = v; refrescarUI(); };

    window.actualizarTodo = () => {
        if(confirm("¿Actualizar sistema?")) { localStorage.clear(); location.reload(); }
    };

    window.mostrarPagina = (id) => {
        estadoUI.busquedaCat = ""; 
        estadoUI.busquedaInv = "";
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        document.getElementById('pag-' + id).style.display = 'block';
        refrescarUI();
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
    window.mostrarAgregarObjeto = () => {
        window.mostrarPagina('control'); // Usamos el contenedor de panel-interactivo
        dibujarFormularioObjeto();
    };

    window.ejecutarAgregarObjeto = () => {
        const datos = {
            nombre: document.getElementById('new-obj-name').value.trim(),
            tipo: document.getElementById('new-obj-tipo').value,
            mat: document.getElementById('new-obj-mat').value,
            eff: document.getElementById('new-obj-eff').value.trim(),
            rar: document.getElementById('new-obj-rar').value
        };

        const reparticion = {};
        document.querySelectorAll('.cant-input').forEach(input => {
            reparticion[input.dataset.player] = input.value;
        });

        agregarObjetoManual(datos, reparticion, () => {
            window.mostrarPagina('op-menu');
        });
    };

    document.getElementById('input-log')?.addEventListener('change', (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => importarLog(ev.target.result, refrescarUI);
        reader.readAsText(e.target.files[0]);
    });

    refrescarUI();
}
iniciar();

