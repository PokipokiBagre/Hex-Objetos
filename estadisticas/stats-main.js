import { statsGlobal, estadoUI, guardar } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { refrescarUI, dibujarMenuOP, dibujarDiseñador } from './stats-ui.js';
import { exportarCSVCompleto } from './stats-logic.js';

async function iniciar() {
    // Intentamos cargar desde el CSV primero para asegurar que Linda aparezca
    const exito = await cargarStatsDesdeCSV();
    
    if (!exito) {
        // Si el CSV falla, intentamos usar el respaldo local
        const cache = localStorage.getItem('hex_stats_vFinal_v2');
        if (cache) Object.assign(statsGlobal, JSON.parse(cache));
    }

    window.setActivo = (id) => { estadoUI.personajeActivo = id; refrescarUI(); };
    
    window.mostrarPagina = (id) => {
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        document.getElementById('pag-' + id).style.display = 'block';
        if(id === 'admin') dibujarMenuOP();
        refrescarUI();
    };

    window.dibujarDiseñador = () => { dibujarDiseñador(); };
    window.descargarEstadoCSV = exportarCSVCompleto;

    window.agregarManual = () => {
        const id = document.getElementById('n-id').value;
        if(!id) return alert("Falta ID");
        statsGlobal[id] = {
            hex: parseInt(document.getElementById('n-hx').value)||0,
            vex: parseInt(document.getElementById('n-vx').value)||0,
            afin: { fis:parseInt(document.getElementById('n-fi').value)||0, ene:parseInt(document.getElementById('n-en').value)||0, esp:parseInt(document.getElementById('n-es').value)||0, man:parseInt(document.getElementById('n-ma').value)||0, psi:parseInt(document.getElementById('n-ps').value)||0, osc:parseInt(document.getElementById('n-os').value)||0 },
            vida: { act:parseInt(document.getElementById('n-ra').value)||0, maxBase:parseInt(document.getElementById('n-rm').value)||0, azul:parseInt(document.getElementById('n-aa').value)||0, oro:0 },
            dan: { r:0, a:0, e:0 }, learnedSpells: []
        };
        guardar();
        alert("Personaje '" + id + "' agregado correctamente."); 
        refrescarUI();
        window.mostrarPagina('publico');
    };

    window.actualizarTodo = async () => { 
        await cargarStatsDesdeCSV();
        refrescarUI();
        alert("Sincronización finalizada"); 
    };
    
    window.ejecutarSyncLog = () => { if (prompt("Acceso:") === atob('Y2FuZXk=')) { estadoUI.esAdmin = true; window.mostrarPagina('admin'); } };

    refrescarUI();
}
iniciar();
