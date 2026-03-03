import { statsGlobal, estadoUI, guardar } from './stats-state.js';
import { cargarTodoDesdeCSV, procesarTextoCSV } from './stats-data.js';
import { dibujarCatalogo, dibujarDetalle, dibujarMenuOP, dibujarFormularioCrear, dibujarFormularioEditar } from './stats-ui.js';
import { generarCSVExportacion, descargarArchivoCSV } from './stats-logic.js';

window.mostrarCatalogo = () => { estadoUI.vistaActual = 'catalogo'; refrescarVistas(); };
window.abrirDetalle = (nombre) => { estadoUI.personajeSeleccionado = nombre; estadoUI.vistaActual = 'detalle'; refrescarVistas(); };

// VALIDACIÓN DE CONTRASEÑA
window.abrirMenuOP = () => { 
    if (estadoUI.esAdmin) {
        estadoUI.vistaActual = 'op'; refrescarVistas(); return;
    }
    const pass = prompt("Acceso Restringido. Contraseña:");
    if (pass === atob('Y2FuZXk=')) { // 'caney'
        estadoUI.esAdmin = true;
        estadoUI.vistaActual = 'op'; 
        refrescarVistas();
    } else {
        if(pass !== null) alert("Acceso denegado.");
    }
};

window.mostrarPaginaOP = (subvista) => {
    estadoUI.vistaActual = 'op';
    refrescarVistas();
    const sub = document.getElementById('sub-vista-op');
    if(subvista === 'crear') sub.innerHTML = dibujarFormularioCrear();
    if(subvista === 'editar') sub.innerHTML = dibujarFormularioEditar();
};

window.ejecutarCreacionNPC = () => {
    const nombre = document.getElementById('npc-nombre').value.trim();
    if(!nombre) return alert("Falta el nombre");
    statsGlobal[nombre] = {
        isNPC: true,
        hex: parseInt(document.getElementById('npc-hex').value) || 0,
        vex: parseInt(document.getElementById('npc-vex').value) || 0,
        vidaRojaActual: parseInt(document.getElementById('npc-vr').value) || 0,
        vidaRojaMax: parseInt(document.getElementById('npc-vr').value) || 0,
        vidaAzul: parseInt(document.getElementById('npc-va').value) || 0,
        guardaDorada: 0, danoRojo: 0, danoAzul: 0, elimDorada: 0,
        afinidades: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0 },
        buffs: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0 }
    };
    guardar(); alert("NPC Creado"); window.abrirDetalle(nombre);
};

window.ejecutarEdicionBuffs = () => {
    const p = statsGlobal[estadoUI.personajeSeleccionado];
    if(!p) return;
    p.buffs = {
        danoRojo: parseInt(document.getElementById('b-dr').value) || 0,
        danoAzul: parseInt(document.getElementById('b-da').value) || 0,
        elimDorada: parseInt(document.getElementById('b-ed').value) || 0,
        psiquica: parseInt(document.getElementById('b-psi').value) || 0,
        espiritual: parseInt(document.getElementById('b-esp').value) || 0,
        vidaRojaMaxExtra: parseInt(document.getElementById('b-vrx').value) || 0,
        fisica: p.buffs.fisica, energetica: p.buffs.energetica, mando: p.buffs.mando, oscura: p.buffs.oscura // preserva el resto
    };
    guardar(); alert("Buffs actualizados"); window.abrirDetalle(estadoUI.personajeSeleccionado);
};

window.forzarSincronizacion = async () => {
    if(confirm("¿Seguro? Borrarás los NPCs locales y resetarás buffs.")) {
        await cargarTodoDesdeCSV(); alert("Sincronización completada."); window.mostrarCatalogo();
    }
};

window.descargarAumentada = () => { descargarArchivoCSV(generarCSVExportacion(), "HEX_ESTADOS_AUMENTADO.csv"); };
window.subirAumentada = (e) => {
    const archivo = e.target.files[0]; if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(ev) { procesarTextoCSV(ev.target.result); alert("CSV inyectado."); window.mostrarCatalogo(); };
    lector.readAsText(archivo);
};

function refrescarVistas() {
    document.getElementById('vista-catalogo').classList.add('oculto');
    document.getElementById('vista-detalle').classList.add('oculto');
    document.getElementById('vista-op').classList.add('oculto');

    if (estadoUI.vistaActual === 'catalogo') { document.getElementById('vista-catalogo').classList.remove('oculto'); dibujarCatalogo(); }
    else if (estadoUI.vistaActual === 'detalle') { document.getElementById('vista-detalle').classList.remove('oculto'); dibujarDetalle(); }
    else if (estadoUI.vistaActual === 'op') { 
        document.getElementById('vista-op').classList.remove('oculto'); 
        document.getElementById('vista-op').innerHTML = dibujarMenuOP();
    }
}

async function iniciar() {
    try {
        const cache = localStorage.getItem('hex_stats_v2');
        if (!cache) await cargarTodoDesdeCSV();
        else { Object.assign(statsGlobal, JSON.parse(cache).stats); }
    } catch (error) { console.error("Error crítico:", error); }
    finally { refrescarVistas(); }
}

iniciar();
