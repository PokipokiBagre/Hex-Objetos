import { statsGlobal, estadoUI, listaEstados, guardar } from './stats-state.js';
import { cargarTodoDesdeCSV, procesarTextoCSV, cargarDiccionarioEstados } from './stats-data.js';
import { dibujarCatalogo, dibujarDetalle, dibujarMenuOP, dibujarFormularioCrear, dibujarFormularioEditar } from './stats-ui.js';
import { generarCSVExportacion, descargarArchivoCSV, calcularVidaRojaMax, calcularVidaAzulMax } from './stats-logic.js';

function repintarConScroll(vista) {
    const scrollY = window.scrollY;
    const containerId = vista === 'detalle' ? 'vista-detalle' : 'sub-vista-op';
    const container = document.getElementById(containerId);
    
    if (container) {
        const h = container.getBoundingClientRect().height;
        container.style.minHeight = h + 'px';
        if (vista === 'detalle') dibujarDetalle(); else container.innerHTML = dibujarFormularioEditar();
        window.scrollTo(0, scrollY);
        requestAnimationFrame(() => container.style.minHeight = '');
    } else {
        refrescarVistas(); window.scrollTo(0, scrollY);
    }
}

window.mostrarCatalogo = () => { estadoUI.vistaActual = 'catalogo'; refrescarVistas(); window.scrollTo(0,0); };
window.abrirDetalle = (nombre) => { estadoUI.personajeSeleccionado = nombre; estadoUI.vistaActual = 'detalle'; refrescarVistas(); window.scrollTo(0,0); };

window.abrirMenuOP = () => { 
    const enrutarOP = () => { if (estadoUI.vistaActual === 'catalogo') estadoUI.vistaActual = 'op'; refrescarVistas(); };
    if (estadoUI.esAdmin) { enrutarOP(); return; }
    const pass = prompt("Acceso Restringido. Contraseña:");
    if (pass === atob('Y2FuZXk=')) { estadoUI.esAdmin = true; enrutarOP(); } else { if(pass !== null) alert("Acceso denegado."); }
};

window.mostrarPaginaOP = (subvista) => {
    estadoUI.vistaActual = 'op'; refrescarVistas();
    const sub = document.getElementById('sub-vista-op');
    if(subvista === 'crear') sub.innerHTML = dibujarFormularioCrear(); if(subvista === 'editar') sub.innerHTML = dibujarFormularioEditar();
};

window.setFiltro = (tipo, valor) => {
    if(tipo === 'rol') estadoUI.filtroRol = valor;
    if(tipo === 'act') estadoUI.filtroAct = valor;
    refrescarVistas();
};

window.toggleIdentidad = (prop) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    p[prop] = !p[prop]; if (prop === 'isPlayer') p.isNPC = !p.isPlayer; 
    guardar(); repintarConScroll('op');
};

window.cambioManual = (statId, valorStr, tipoAccion) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    const maxRojoPrev = calcularVidaRojaMax(p);
    let val = parseInt(valorStr); if (isNaN(val)) val = 0; 

    if (tipoAccion === 'buff') p.buffs[statId] = val;
    else if (tipoAccion === 'baseTop') p[statId] = Math.max(0, val);
    else if (tipoAccion === 'baseAfin') p.afinidades[statId] = Math.max(0, val);
    else if (tipoAccion === 'spellTop' || tipoAccion === 'spellAfin') { p.hechizos[statId] = val; }
    else if (tipoAccion === 'directo') p[statId] = Math.max(0, val);
    
    const deltaRojo = calcularVidaRojaMax(p) - maxRojoPrev;
    if (deltaRojo > 0) p.vidaRojaActual = Math.max(0, p.vidaRojaActual + deltaRojo);
    const limiteReal = calcularVidaRojaMax(p);
    if (p.vidaRojaActual > limiteReal) p.vidaRojaActual = limiteReal;

    guardar();
    if (estadoUI.vistaActual === 'detalle') repintarConScroll('detalle'); else repintarConScroll('op');
};

window.modificarBuff = (statId, cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    const maxRojoPrev = calcularVidaRojaMax(p);
    p.buffs[statId] = (p.buffs[statId] || 0) + cantidad;
    const deltaRojo = calcularVidaRojaMax(p) - maxRojoPrev;
    if (deltaRojo > 0) p.vidaRojaActual = Math.max(0, p.vidaRojaActual + deltaRojo);
    guardar(); repintarConScroll('detalle');
};

window.modBaseTop = (statId, cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    const maxRojoPrev = calcularVidaRojaMax(p);
    p[statId] = Math.max(0, (p[statId] || 0) + cantidad);
    const deltaRojo = calcularVidaRojaMax(p) - maxRojoPrev;
    if (deltaRojo > 0) p.vidaRojaActual = Math.max(0, p.vidaRojaActual + deltaRojo);
    guardar(); repintarConScroll('op');
};

window.modBaseAfin = (statId, cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    const maxRojoPrev = calcularVidaRojaMax(p);
    p.afinidades[statId] = Math.max(0, (p.afinidades[statId] || 0) + cantidad);
    const deltaRojo = calcularVidaRojaMax(p) - maxRojoPrev;
    if (deltaRojo > 0) p.vidaRojaActual = Math.max(0, p.vidaRojaActual + deltaRojo);
    guardar(); repintarConScroll('op');
};

window.modSpellTop = (statId, cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    const maxRojoPrev = calcularVidaRojaMax(p);
    p.hechizos[statId] = (p.hechizos[statId] || 0) + cantidad;
    const deltaRojo = calcularVidaRojaMax(p) - maxRojoPrev;
    if (deltaRojo > 0) p.vidaRojaActual = Math.max(0, p.vidaRojaActual + deltaRojo);
    guardar(); repintarConScroll('op');
};

window.modSpellAfin = (statId, cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    const maxRojoPrev = calcularVidaRojaMax(p);
    p.hechizos[statId] = (p.hechizos[statId] || 0) + cantidad;
    const deltaRojo = calcularVidaRojaMax(p) - maxRojoPrev;
    if (deltaRojo > 0) p.vidaRojaActual = Math.max(0, p.vidaRojaActual + deltaRojo);
    guardar(); repintarConScroll('op');
};

window.modificarDirecto = (statId, cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    p[statId] = Math.max(0, (p[statId] || 0) + cantidad); guardar(); repintarConScroll('op');
};

window.modLibre = (statId, cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    p[statId] = Math.max(0, (p[statId] || 0) + cantidad); guardar(); repintarConScroll('detalle');
};

window.modBlueExtra = (cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    p.buffs.vidaAzulExtra = Math.max(0, (p.buffs.vidaAzulExtra || 0) + cantidad);
    p.vidaAzul = Math.max(0, (p.vidaAzul || 0) + cantidad);
    guardar(); repintarConScroll('detalle');
};

window.modGoldExtra = (cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    p.buffs.guardaDoradaExtra = Math.max(0, (p.buffs.guardaDoradaExtra || 0) + cantidad);
    p.guardaDorada = Math.max(0, (p.guardaDorada || 0) + cantidad);
    guardar(); repintarConScroll('detalle');
};

window.modForm = (inputId, cantidad) => {
    const input = document.getElementById(inputId);
    if(input) { let val = parseInt(input.value) || 0; input.value = Math.max(0, val + Math.max(-Math.abs(val), cantidad)); }
};

window.modEstado = (estadoId, cantidad) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    p.estados[estadoId] = Math.max(0, (p.estados[estadoId] || 0) + cantidad); guardar(); repintarConScroll('op');
};

window.toggleEstado = (estadoId) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    p.estados[estadoId] = !p.estados[estadoId]; guardar(); repintarConScroll('op');
};

window.ejecutarClonacion = (tipo) => {
    const sourceSelect = document.getElementById('clon-source'); if(!sourceSelect) return;
    const sourceName = sourceSelect.value; if(!sourceName) { alert("Por favor, selecciona un personaje de origen."); return; }
    const targetName = estadoUI.personajeSeleccionado; 
    const msg = tipo === 'estados' ? `¿Seguro que deseas IMPORTAR solo los BUFFS y ESTADOS ALTERADOS desde ${sourceName} hacia ${targetName}?` : `¿Seguro que deseas CLONAR POR COMPLETO a ${sourceName} sobre ${targetName}?`;
    if(!confirm(msg)) return;

    const source = statsGlobal[sourceName]; const target = statsGlobal[targetName];
    target.buffs = JSON.parse(JSON.stringify(source.buffs));
    target.estados = JSON.parse(JSON.stringify(source.estados));

    if (tipo === 'completo') {
        target.vidaRojaActual = source.vidaRojaActual; target.vidaRojaMax = source.vidaRojaMax;
        target.vidaAzul = source.vidaAzul; target.baseVidaAzul = source.baseVidaAzul; 
        target.guardaDorada = source.guardaDorada; target.baseGuardaDorada = source.baseGuardaDorada;
        target.afinidades = JSON.parse(JSON.stringify(source.afinidades));
        target.hechizos = JSON.parse(JSON.stringify(source.hechizos || {}));
        target.danoRojo = source.danoRojo; target.danoAzul = source.danoAzul; target.elimDorada = source.elimDorada;
        target.hex = source.hex; target.vex = source.vex;
    }
    guardar(); alert(`Importación completada.`); sourceSelect.value = ""; repintarConScroll('detalle'); 
};

window.ejecutarCreacionNPC = () => {
    const nombre = document.getElementById('npc-nombre').value.trim();
    if(!nombre) return alert("Falta dar un nombre.");
    const vidaA = parseInt(document.getElementById('npc-va').value) || 0; const guardaD = parseInt(document.getElementById('npc-gd').value) || 0;
    
    let stInit = {};
    listaEstados.forEach(e => { stInit[e.id] = (e.tipo === 'numero') ? 0 : false; });

    statsGlobal[nombre] = {
        isPlayer: false, isNPC: true, isActive: true, hex: parseInt(document.getElementById('npc-hex').value) || 0, vex: parseInt(document.getElementById('npc-vex').value) || 0,
        vidaRojaActual: parseInt(document.getElementById('npc-vra').value) || 0, vidaRojaMax: parseInt(document.getElementById('npc-vrm').value) || 0,
        vidaAzul: vidaA, baseVidaAzul: vidaA, guardaDorada: guardaD, baseGuardaDorada: guardaD,
        danoRojo: parseInt(document.getElementById('npc-dr').value) || 0, danoAzul: parseInt(document.getElementById('npc-da').value) || 0, elimDorada: parseInt(document.getElementById('npc-ed').value) || 0,
        afinidades: { fisica: parseInt(document.getElementById('npc-fis').value) || 0, energetica: parseInt(document.getElementById('npc-ene').value) || 0, espiritual: parseInt(document.getElementById('npc-esp').value) || 0, mando: parseInt(document.getElementById('npc-man').value) || 0, psiquica: parseInt(document.getElementById('npc-psi').value) || 0, oscura: parseInt(document.getElementById('npc-osc').value) || 0 },
        hechizos: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
        buffs: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
        estados: stInit
    };
    guardar(); window.abrirDetalle(nombre); window.scrollTo(0,0);
};

// ACTUALIZACIÓN SILENCIOSA Y CONTEXTUAL
window.forzarSincronizacion = async () => {
    if(confirm("¿Seguro que deseas Actualizar? Esto descargará la última versión maestra, borrando NPCs locales y efectos de esta sesión.")) {
        const prevScroll = window.scrollY;
        await cargarTodoDesdeCSV(); 
        
        // Si estábamos viendo a un PJ y ese PJ sigue existiendo en el CSV descargado, lo dejamos ahí sin molestar
        if (estadoUI.personajeSeleccionado && !statsGlobal[estadoUI.personajeSeleccionado]) {
            window.mostrarCatalogo(); // Si el personaje fue borrado, forzamos la ida al catálogo
        } else {
            refrescarVistas();
            window.scrollTo(0, prevScroll);
        }
    }
};

window.descargarAumentada = () => { descargarArchivoCSV(generarCSVExportacion(), "HEX_ESTADOS_AUMENTADO.csv"); };

window.triggerSubirCSV = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv';
    input.onchange = (e) => {
        const archivo = e.target.files[0]; if (!archivo) return; const lector = new FileReader();
        lector.onload = function(ev) { procesarTextoCSV(ev.target.result); window.mostrarCatalogo(); };
        lector.readAsText(archivo);
    }; input.click();
};

function refrescarVistas() {
    document.getElementById('vista-catalogo').classList.add('oculto'); document.getElementById('vista-detalle').classList.add('oculto'); document.getElementById('vista-op').classList.add('oculto');
    if (estadoUI.vistaActual === 'catalogo') { document.getElementById('vista-catalogo').classList.remove('oculto'); dibujarCatalogo(); }
    else if (estadoUI.vistaActual === 'detalle') { document.getElementById('vista-detalle').classList.remove('oculto'); dibujarDetalle(); }
    else if (estadoUI.vistaActual === 'op') { document.getElementById('vista-op').classList.remove('oculto'); document.getElementById('vista-op').innerHTML = dibujarMenuOP(); }
}

async function iniciar() {
    try { 
        await cargarDiccionarioEstados();
        const cache = localStorage.getItem('hex_stats_v2'); 
        if (!cache) { await cargarTodoDesdeCSV(); } else { Object.assign(statsGlobal, JSON.parse(cache).stats); } 
    } 
    catch (error) { console.error("Error crítico:", error); } 
    finally { refrescarVistas(); }
}
iniciar();
