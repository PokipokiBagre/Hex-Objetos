import { estadoUI, statsGlobal, guardarStats } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { dibujarUIStats, dibujarAdminStats } from './stats-ui.js';
import { descargarCSVStats } from './stats-logic.js';

async function iniciarStats() {
    // 1. Carga de datos inicial (Igual que iniciar() en objetos)
    try {
        await cargarStatsDesdeCSV();
        console.log("Datos cargados:", Object.keys(statsGlobal));
    } catch (e) {
        console.error("Error cargando CSV:", e);
    }

    // 2. Vinculación Global (window)
    window.setJugadorStats = (j) => { 
        estadoUI.jugadorActivo = j; 
        dibujarUIStats(); 
        if(estadoUI.esAdmin) dibujarAdminStats(); 
    };

    window.setPage = (id) => { 
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        const target = document.getElementById('pag-' + id);
        if(target) target.style.display = 'block';
        dibujarUIStats();
    };

    window.actualizarStats = async () => { 
        if(confirm("¿Sincronizar?")) { 
            await cargarStatsDesdeCSV(); 
            dibujarUIStats(); 
            alert("OK"); 
        } 
    };
    
    const _session = 'Y2FuZXk=';
    window.accesoAdmin = () => {
        if (estadoUI.esAdmin) { window.setPage('admin'); return; }
        const i = prompt("Validation:");
        if (i === atob(_session)) { 
            estadoUI.esAdmin = true; 
            window.setPage('admin'); 
        }
    };

    window.descargarCSVStats = descargarCSVStats;

    // 3. Dibujo inicial
    dibujarUIStats();
}

iniciarStats();
