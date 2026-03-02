import { statsGlobal, estadoUI } from './stats-state.js';
import { cargarStatsDesdeCSV } from './stats-data.js';
import { refrescarUI, dibujarAdmin } from './stats-ui.js';

async function iniciar() {
    await cargarStatsDesdeCSV();

    window.setActivo = (id) => { estadoUI.personajeActivo = id; refrescarUI(); };
    
    window.mostrarPagina = (id) => {
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
        document.getElementById('pag-' + id).style.display = 'block';
        if(id === 'admin') dibujarAdmin();
        else { estadoUI.personajeActivo = null; refrescarUI(); }
    };

    window.generarLineaCSV = () => {
        const id = document.getElementById('new-id').value;
        const h = document.getElementById('new-hex').value || 0;
        const v = document.getElementById('new-vex').value || 0;
        const f = document.getElementById('new-fis').value || 0;
        const e = document.getElementById('new-ene').value || 0;
        const s = document.getElementById('new-esp').value || 0;
        const m = document.getElementById('new-man').value || 0;
        const p = document.getElementById('new-psi').value || 0;
        const o = document.getElementById('new-osc').value || 0;
        const rA = document.getElementById('new-rAct').value || 0;
        const rM = document.getElementById('new-rMax').value || 10;
        const aA = document.getElementById('new-aAct').value || 0;
        const gold = document.getElementById('new-gold').value || 0;
        const spl = document.getElementById('new-spells').value || "";

        // Genera línea exacta A-S
        const linea = `"${id}",${h},${v},${f},${e},${s},${m},${p},${o},${rA},${rM},${aA},${gold},0,0,0,"","${spl}",""\n`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([linea], {type:'text/csv'}));
        link.download = `ENTRADA_${id}.csv`; link.click();
    };

    window.actualizarTodo = async () => { if(confirm("¿Sincronizar?")) { await cargarStatsDesdeCSV(); refrescarUI(); } };
    
    window.ejecutarSyncLog = () => {
        if (prompt("Validation:") === atob('Y2FuZXk=')) { 
            estadoUI.esAdmin = true; 
            window.mostrarPagina('admin'); 
        }
    };

    refrescarUI();
}
iniciar();
