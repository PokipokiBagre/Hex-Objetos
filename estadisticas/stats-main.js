import { estadoUI, statsGlobal, guardarStats } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { dibujarUIStats, dibujarAdminStats } from './stats-ui.js';
import { descargarCSVStats } from './stats-logic.js';

async function iniciarStats() {
    // 1. Funciones Globales
    window.setJugadorStats = (j) => { 
        estadoUI.jugadorActivo = j; 
        dibujarUIStats(); 
        if(estadoUI.esAdmin) dibujarAdminStats(); 
    };

    window.setPage = (p) => { 
        estadoUI.paginaActiva = p; 
        document.querySelectorAll('.pagina').forEach(div => div.style.display = 'none');
        const target = document.getElementById('pag-' + p);
        if(target) target.style.display = 'block';
        dibujarUIStats();
    };

    window.actualizarStats = () => { 
        if(confirm("¿Sincronizar datos?")) { 
            localStorage.removeItem('hex_stats_v1'); 
            location.reload(); 
        } 
    };

    const _KEY = atob('Y2FuZXk='); 
    window.accesoAdmin = () => {
        if(estadoUI.esAdmin) { window.setPage('admin'); return; }
        const code = prompt("System Code:");
        if(code === _KEY) { 
            estadoUI.esAdmin = true;
            window.setPage('admin');
        }
    };

    window.descargarCSVStats = descargarCSVStats;

    // 2. Carga y Dibujo inicial
    try {
        console.log("Iniciando carga de personajes...");
        await cargarStatsDesdeCSV();
        dibujarUIStats();
    } catch (e) {
        console.error("Error crítico:", e);
    }
}

iniciarStats();
