import { invGlobal, statsGlobal, estadoUI } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { refrescarUI, dibujarMenuOP } from './stats-ui.js';

async function iniciar() {
    // 1. Limpieza de cache igual que en objetos
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") { 
        localStorage.removeItem('hex_stats_v1'); 
    }
    
    // 2. Carga prioritaria
    try {
        await cargarStatsDesdeCSV();
        console.log("Personajes conectados");
    } catch (e) {
        console.error("Error de conexión:", e);
    }

    // 3. Funciones Globales (Copiado de tu sistema de objetos)
    window.setJugadorStats = (j) => { estadoUI.jugadorActivo = j; refrescarUI(); };
    
    window.actualizarTodo = async () => { 
        if(confirm("¿Sincronizar datos?")) { 
            await cargarStatsDesdeCSV(); 
            refrescarUI(); 
            alert("Sincronización completa"); 
        } 
    };

    const _access = 'Y2FuZXk=';
    window.ejecutarSyncLog = () => { 
        if (estadoUI.esAdmin) { window.mostrarPagina('admin'); return; } 
        const i = prompt("Validation:"); 
        if (i === atob(_access)) { 
            estadoUI.esAdmin = true; 
            window.mostrarPagina('admin'); 
        } 
    };

    window.mostrarPagina = (id) => { 
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none'); 
        const target = document.getElementById('pag-' + id);
        if(target) target.style.display = 'block'; 
        refrescarUI(); 
    };

    // 4. Inicio
    refrescarUI();
}
iniciar();
