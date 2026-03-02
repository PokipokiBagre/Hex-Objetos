import { estadoUI, statsGlobal } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { dibujarUIStats } from './stats-ui.js';

async function iniciarStats() {
    try {
        console.log("Conectando con la base de datos...");
        await cargarStatsDesdeCSV(); 
        console.log("Conexión establecida. Jugadores detectados:", Object.keys(statsGlobal));
        
        // Vinculación de funciones a window
        window.setJugadorStats = (j) => { 
            estadoUI.jugadorActivo = j; 
            dibujarUIStats(); 
        };

        window.setPage = (p) => { 
            document.querySelectorAll('.pagina').forEach(div => div.style.display = 'none');
            const target = document.getElementById('pag-' + p);
            if(target) target.style.display = 'block';
            dibujarUIStats();
        };

        window.actualizarStats = async () => { 
            if(confirm("¿Sincronizar datos?")) { 
                await cargarStatsDesdeCSV(); 
                dibujarUIStats(); 
            } 
        };

        // Dibujo inicial (Linda, Corvin, etc aparecerán aquí)
        dibujarUIStats();

    } catch (e) {
        document.getElementById('selector-jugadores').innerHTML = 
            `<p style="color:red; text-align:center;">❌ ERROR DE CONEXIÓN: Verifica el CSV.</p>`;
    }
}

iniciarStats();
