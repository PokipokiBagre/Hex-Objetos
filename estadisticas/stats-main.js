import { statsGlobal, estadoUI, guardar } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { refrescarUI, dibujarDisenador } from './stats-ui.js';
import { generarLineaCSV } from './stats-logic.js';

async function iniciar() {
    await cargarStatsDesdeCSV();

    window.mostrarPagina = (id) => {
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        document.getElementById('pag-' + id).style.display = 'block';
        if(id === 'admin') dibujarDisenador();
        else refrescarUI();
    };

    window.crearPersonaje = () => {
        const id = document.getElementById('new-id').value.trim();
        const nom = document.getElementById('new-nom').value.trim();
        const bio = document.getElementById('new-bio').value.trim();
        if(!id) return alert("Falta ID");
        
        const linea = generarLineaCSV(id, nom, bio);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([linea], {type:'text/csv'}));
        link.download = `NUEVO_PERSONAJE_${id}.csv`;
        link.click();
        alert("Archivo generado. Agrégalo a tu CSV maestro.");
    };

    window.actualizarTodo = async () => { 
        if(confirm("¿Sincronizar datos?")) { await cargarStatsDesdeCSV(); refrescarUI(); } 
    };

    window.ejecutarSyncLog = () => {
        const i = prompt("Validation:");
        if (i === atob('Y2FuZXk=')) { 
            estadoUI.esAdmin = true; 
            window.mostrarPagina('admin'); 
        }
    };

    refrescarUI();
}

iniciar();
