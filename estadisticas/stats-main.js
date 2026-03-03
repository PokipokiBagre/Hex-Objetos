import { statsGlobal, estadoUI, guardar } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { refrescarUI, dibujarMenuOP, dibujarDiseñador, verDetalle } from './stats-ui.js';
import { descargarEstadoCSV } from './stats-logic.js';

async function iniciar() {
    await cargarStatsDesdeCSV();

    window.mostrarPagina = (id) => {
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        document.getElementById('pag-' + id).style.display = 'block';
        if(id === 'admin') dibujarMenuOP();
        refrescarUI();
    };

    window.dibujarDiseñador = dibujarDiseñador;
    window.descargarEstadoCSV = descargarEstadoCSV;
    window.verDetalle = verDetalle;

    window.agregarLocal = () => {
        const id = document.getElementById('n-id').value;
        if(!id) return alert("Falta ID");
        statsGlobal[id] = {
            id: id, hex: document.getElementById('n-hx').value, vex: document.getElementById('n-vx').value,
            fi: document.getElementById('n-fi').value, en: document.getElementById('n-en').value, es: document.getElementById('n-es').value, 
            ma: document.getElementById('n-ma').value, ps: document.getElementById('n-ps').value, os: document.getElementById('n-os').value,
            r: document.getElementById('n-ra').value, rm: document.getElementById('n-rm').value, az: document.getElementById('n-aa').value, gd: 0, dr:0, da:0, eo:0
        };
        guardar(); refrescarUI(); window.mostrarPagina('publico');
    };

    window.actualizarTodo = async () => { if(confirm("¿Sincronizar?")) { await cargarStatsDesdeCSV(); refrescarUI(); } };
    window.ejecutarSyncLog = () => { if (prompt("Val:") === atob('Y2FuZXk=')) { estadoUI.esAdmin = true; window.mostrarPagina('admin'); } };

    refrescarUI();
}
iniciar();
