import { estadoUI, statsGlobal, guardarStats } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { dibujarUIStats, dibujarAdminStats, dibujarCreacionObjeto } from './stats-ui.js';
import { descargarCSVStats } from './stats-logic.js';

async function iniciarStats() {
    // Vinculamos las funciones al objeto window para que los botones onclick funcionen
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
        
        // Si entramos a admin, dibujamos el panel admin, si no, la UI normal
        if(p === 'admin') {
            dibujarAdminStats();
        } else {
            dibujarUIStats();
        }
    };

    window.actualizarStats = () => { 
        if(confirm("¿Sincronizar datos con el Sheet?")) { 
            localStorage.removeItem('hex_stats_v1'); 
            location.reload(); 
        } 
    };
    
    window.accesoAdmin = () => {
        if(estadoUI.esAdmin) { window.setPage('admin'); return; }
        const pass = prompt("System Code:");
        if(pass === atob('Y2FuZXk=')) { // contraseña: caney
            estadoUI.esAdmin = true;
            window.setPage('admin');
        }
    };

    window.descargarCSVStats = descargarCSVStats;

    // Función que faltaba para el botón de copiar
    window.copyToClipboard = (id) => {
        const text = document.getElementById(id).value;
        navigator.clipboard.writeText(text).then(() => alert("Copiado al portapapeles"));
    };

    // Carga inicial
    try {
        await cargarStatsDesdeCSV();
        dibujarUIStats();
    } catch (e) {
        console.error("Error crítico de datos:", e);
    }
}

iniciarStats();
