import { statsGlobal, estadoUI, guardar } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { refrescarUI } from './stats-ui.js';
import { generarLineaCSV } from './stats-logic.js';

async function iniciar() {
    // Sincronizar al recargar
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") { localStorage.removeItem('hex_stats_v2'); }
    
    await cargarStatsDesdeCSV();

    window.mostrarPagina = (id) => {
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        const target = document.getElementById('pag-' + id);
        if(target) target.style.display = 'block';
        refrescarUI();
    };

    window.descargarNuevoPersonaje = () => {
        const id = document.getElementById('new-id').value.trim();
        const nom = document.getElementById('new-nom').value.trim();
        const bio = document.getElementById('new-bio').value.trim();
        if(!id) return alert("Falta ID");
        
        const csvLine = generarLineaCSV(id, nom, bio);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csvLine], {type:'text/csv'}));
        link.download = `ENTRADA_CSV_${id}.csv`;
        link.click();
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
