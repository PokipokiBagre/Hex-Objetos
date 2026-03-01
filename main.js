import { invGlobal, objGlobal, historial, estadoUI } from './state.js';
import { cargarTodoDesdeCSV } from './data.js';
import { modificar, descargarLog, importarLog, descargarEstadoCSV, descargarInventariosJPG } from './logic.js';
import { refrescarUI, dibujarMenuOP } from './ui.js';

async function iniciar() {
    const cache = localStorage.getItem('hex_db_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else {
        const p = JSON.parse(cache);
        Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj);
        historial.push(...(p.his || []));
    }
    
    const _db_key = 'UmVzZXRfRGF0YWJhc2VfMjAyNg==';
    const _adm_token = 'WDk4MkxfWloycV9M';          
    const _session = 'Y2FuZXk=';  
    const _root_access = 'U3VwZXJVc2VyX0FkbWlu';  

 window.ejecutarSyncLog = () => {
    const i = prompt("System Validation Code:");
    if (estadoUI.esAdmin || i === atob(_session)) {
        estadoUI.esAdmin = true; 
        dibujarMenuOP(); 
        window.mostrarPagina('op-menu');
    } else { 
        alert("Error de redundancia en el servidor."); 
    }
};

    window.setBusqueda = (valor) => {
        estadoUI.busquedaOP = valor;
        refrescarUI();
    };

    window.actualizarTodo = () => {
        if(confirm("¿Actualizar sistema?")) { localStorage.clear(); location.reload(); }
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
    window.subirLogManual = () => document.getElementById('input-log').click();

    refrescarUI();
}
iniciar();

