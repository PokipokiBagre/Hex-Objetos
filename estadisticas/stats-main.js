import { statsGlobal, estadoUI, listaEstados, guardar } from './stats-state.js';
import { cargarTodoDesdeCSV, procesarTextoCSV, cargarDiccionarioEstados } from './stats-data.js';
import { dibujarCatalogo, dibujarResumenVisual, dibujarDetalle, dibujarMenuOP, dibujarHexOP, dibujarFormularioCrear, dibujarPanelEdicionOP } from './stats-ui.js';
import { generarCSVExportacion, descargarArchivoCSV, calcularVidaRojaMax, getMysticBonus } from './stats-logic.js';

const API_ESTADISTICAS = 'https://script.google.com/macros/s/AKfycbwW4AXM9QSrPYR4vjXPdwSEhV1Q-t9S0exoskZQGoerVRJOsEMzReN1piMWzCfzW_RLmQ/exec';

let formOverrides = { 'npc-vrm': false, 'npc-vra': false, 'npc-va': false };

// Inicializar cola de forma segura
if (!estadoUI.colaCambios) estadoUI.colaCambios = { stats: {} };
if (!estadoUI.colaCambios.stats) estadoUI.colaCambios.stats = {};

// --- LOGS DE HEX ---
function updateHexLogText() {
    const textarea = document.getElementById('hex-log-textarea');
    if (!textarea) return; 
    let finalOutput = "";
    Object.keys(estadoUI.hexLog).sort().forEach(char => {
        const log = estadoUI.hexLog[char];
        const p = statsGlobal[char];
        if (!p) return;
        const asisStr = p.isPlayer ? ` (${p.asistencia || 1}/7)` : "";
        log.order.forEach(actionType => {
            if (actionType === 'pos' && log.pos.amount >= 0) finalOutput += `${char} +${log.pos.amount} Hex (${log.pos.finalHex})${asisStr}\n`;
            else if (actionType === 'neg' && log.neg.amount > 0) finalOutput += `${char} -${log.neg.amount} Hex (${log.neg.finalHex})${asisStr}\n`;
            else if (actionType === 'extra' && log.extra.amount > 0) finalOutput += `${char} +${log.extra.amount} Hex ¡EXTRA! (${log.extra.finalHex})${asisStr}\n`;
        });
    });
    textarea.value = finalOutput;
    textarea.scrollTop = textarea.scrollHeight; 
}

window.addHexLogEntry = (nombre, amount, isExtra = false) => {
    const p = statsGlobal[nombre]; if (!p) return;
    if (!estadoUI.hexLog[nombre]) estadoUI.hexLog[nombre] = { pos: { amount: 0, finalHex: 0 }, neg: { amount: 0, finalHex: 0 }, extra: { amount: 0, finalHex: 0 }, order: [] };
    const log = estadoUI.hexLog[nombre];

    if (isExtra) { log.extra.amount += amount; log.extra.finalHex = p.hex; log.order = log.order.filter(k => k !== 'extra'); log.order.push('extra'); } 
    else if (amount > 0) { log.pos.amount += amount; log.pos.finalHex = p.hex; log.order = log.order.filter(k => k !== 'pos'); log.order.push('pos'); } 
    else if (amount < 0) { log.neg.amount += Math.abs(amount); log.neg.finalHex = p.hex; log.order = log.order.filter(k => k !== 'neg'); log.order.push('neg'); } 
    else if (amount === 0) { if (log.order.length === 0) { log.pos.amount = 0; log.pos.finalHex = p.hex; log.order.push('pos'); } }
};

window.limpiarHexLog = () => { estadoUI.hexLog = {}; updateHexLogText(); };
window.copiarHexLog = () => { const textarea = document.getElementById('hex-log-textarea'); if (textarea) { textarea.select(); document.execCommand('copy'); } };

// COPIADO SILENCIOSO CON TOOLTIP
window.copySilently = (texto, event) => {
    try {
        if(event) { event.preventDefault(); event.stopPropagation(); }
        navigator.clipboard.writeText(texto);
        
        const tooltip = document.createElement('div');
        tooltip.innerText = "✨ Copiado!";
        tooltip.className = 'floating-tooltip';
        tooltip.style.left = event.pageX + 'px';
        tooltip.style.top = (event.pageY - 20) + 'px';
        document.body.appendChild(tooltip);
        
        setTimeout(() => tooltip.remove(), 600);
    } catch (e) {
        console.log("Fallo al copiar.", e);
    }
};

window.actualizarBotonSync = () => {
    const btn = document.getElementById('btn-sync-global'); if (!btn) return;
    const statsChanges = Object.keys(estadoUI.colaCambios.stats || {}).length;
    if (statsChanges > 0) {
        btn.classList.remove('oculto');
        btn.innerText = `🔥 GUARDAR CAMBIOS AL SERVIDOR (${statsChanges}) 🔥`;
    } else {
        btn.classList.add('oculto');
    }
};

// ENCOLADO DE LA CADENA X_Y_Z_W_V
window.encolarCambio = (nombre) => {
    try {
        if (!estadoUI.colaCambios) estadoUI.colaCambios = { stats: {} };
        if (!estadoUI.colaCambios.stats) estadoUI.colaCambios.stats = {};
        if (!estadoUI.colaCambios.stats[nombre]) estadoUI.colaCambios.stats[nombre] = {};
        
        const p = statsGlobal[nombre];
        
        const fStr = (b, s, se, bf) => {
            const bSafe = b || 0; const sSafe = s || 0; const seSafe = se || 0; const bfSafe = bf || 0;
            const tot = bSafe + sSafe + seSafe + bfSafe;
            return `${tot}_${bSafe}_${sSafe}_${seSafe}_${bfSafe}`;
        };
        
        const s = estadoUI.colaCambios.stats[nombre];
        s['Hex'] = `${p.hex||0}_${p.asistencia||1}`;
        s['Vex'] = p.isPlayer ? 0 : (p.vex || 0);
        
        s['Fisica'] = fStr(p.afinidadesBase.fisica, p.hechizos.fisica, p.hechizosEfecto.fisica, p.buffs.fisica);
        s['Energetica'] = fStr(p.afinidadesBase.energetica, p.hechizos.energetica, p.hechizosEfecto.energetica, p.buffs.energetica);
        s['Espiritual'] = fStr(p.afinidadesBase.espiritual, p.hechizos.espiritual, p.hechizosEfecto.espiritual, p.buffs.espiritual);
        s['Mando'] = fStr(p.afinidadesBase.mando, p.hechizos.mando, p.hechizosEfecto.mando, p.buffs.mando);
        s['Psiquica'] = fStr(p.afinidadesBase.psiquica, p.hechizos.psiquica, p.hechizosEfecto.psiquica, p.buffs.psiquica);
        s['Oscura'] = fStr(p.afinidadesBase.oscura, p.hechizos.oscura, p.hechizosEfecto.oscura, p.buffs.oscura);
        
        s['Corazones Rojo'] = p.vidaRojaActual || 0;
        s['Corazones Rojos Max'] = fStr(p.baseVidaRojaMax, p.hechizos.vidaRojaMaxExtra, p.hechizosEfecto.vidaRojaMaxExtra, p.buffs.vidaRojaMaxExtra);
        s['Corazones Azules'] = fStr(p.baseVidaAzul, p.hechizos.vidaAzulExtra, p.hechizosEfecto.vidaAzulExtra, p.buffs.vidaAzulExtra);
        s['Guarda Dorada'] = fStr(p.baseGuardaDorada, p.hechizos.guardaDoradaExtra, p.hechizosEfecto.guardaDoradaExtra, p.buffs.guardaDoradaExtra);
        
        s['Daño Rojo'] = fStr(p.baseDanoRojo, p.hechizos.danoRojo, p.hechizosEfecto.danoRojo, p.buffs.danoRojo);
        s['Daño Azul'] = fStr(p.baseDanoAzul, p.hechizos.danoAzul, p.hechizosEfecto.danoAzul, p.buffs.danoAzul);
        s['Eliminacion Dorada'] = fStr(p.baseElimDorada, p.hechizos.elimDorada, p.hechizosEfecto.elimDorada, p.buffs.elimDorada);
        
        const estadoStr = listaEstados.map(e => { let v = p.estados[e.id]; if(e.tipo === 'booleano') return v ? '1' : '0'; return v || '0'; }).join('-');
        s['Estado'] = estadoStr;
        s['Jugador_Activo'] = `${p.isPlayer ? 1 : 0}_${p.isActive ? 1 : 0}`;

        window.actualizarBotonSync();
    } catch(e) {
        console.error("Error al encolar el cambio para la API:", e);
    }
};

window.ejecutarSincronizacion = async () => {
    const btn = document.getElementById('btn-sync-global'); btn.innerText = "Sincronizando..."; btn.disabled = true;
    try {
        const payload = { accion: 'sincronizar_stats', stats: estadoUI.colaCambios.stats };
        const res = await fetch(API_ESTADISTICAS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        const data = await res.json();
        
        if (data.status === 'success') {
            estadoUI.colaCambios.stats = {};
            const cartelito = document.createElement('div');
            cartelito.innerHTML = "¡Guardado Exitoso! ✅";
            cartelito.style.cssText = "position:fixed; top:30px; left:50%; transform:translateX(-50%); background:var(--gold); color:#000; padding:15px 40px; border-radius:8px; font-weight:bold; font-size:1.2em; z-index:9999; box-shadow:0 0 20px var(--gold); font-family:'Cinzel', serif;";
            document.body.appendChild(cartelito);
            setTimeout(() => { window.location.reload(); }, 1200);
        } else {
            alert("Error en el guardado: " + data.message);
            btn.disabled = false; window.actualizarBotonSync();
        }
    } catch(e) {
        alert("Error de conexión al servidor."); btn.disabled = false; window.actualizarBotonSync();
    }
};

// --- POP-UP MODAL (EDITAR FICHA OP) ---
window.abrirModalOP = () => {
    const modal = document.getElementById('modal-op');
    const body = document.getElementById('modal-op-body');
    if (modal && body) {
        body.innerHTML = dibujarPanelEdicionOP();
        modal.classList.remove('oculto');
    }
};

window.cerrarModalOP = () => {
    const modal = document.getElementById('modal-op');
    if (modal) modal.classList.add('oculto');
};

// Cerrar modal al hacer clic fuera
window.onclick = (event) => {
    const modal = document.getElementById('modal-op');
    if (event.target === modal) {
        modal.classList.add('oculto');
    }
};


// --- RENDERIZADO Y NAVEGACIÓN ---
function repintarConScroll(vista) {
    const scrollY = window.scrollY; 
    
    // Si estamos editando el Modal OP, lo repintamos
    const modalBody = document.getElementById('modal-op-body');
    if (!document.getElementById('modal-op').classList.contains('oculto') && modalBody) {
        modalBody.innerHTML = dibujarPanelEdicionOP();
    }

    const containerId = vista === 'detalle' ? 'vista-detalle' : 'sub-vista-op'; 
    const container = document.getElementById(containerId);
    
    if (container) {
        const h = container.getBoundingClientRect().height; container.style.minHeight = h + 'px';
        
        if (vista === 'detalle') dibujarDetalle(); 
        else {
            if (estadoUI.vistaActual === 'hex') container.innerHTML = dibujarHexOP();
            else if (estadoUI.vistaActual === 'crear') container.innerHTML = dibujarFormularioCrear();
        }
        
        if (estadoUI.vistaActual === 'hex') updateHexLogText();
        window.scrollTo(0, scrollY); requestAnimationFrame(() => container.style.minHeight = '');
    } else {
        refrescarVistas(); window.scrollTo(0, scrollY);
    }
}

function refrescarVistas() {
    ['vista-catalogo', 'vista-resumen', 'vista-detalle', 'vista-op'].forEach(id => document.getElementById(id).classList.add('oculto'));
    window.cerrarModalOP(); // Asegura que el modal se cierre al cambiar de página

    if (estadoUI.vistaActual === 'catalogo') { document.getElementById('vista-catalogo').classList.remove('oculto'); dibujarCatalogo(); }
    else if (estadoUI.vistaActual === 'resumen') { document.getElementById('vista-resumen').classList.remove('oculto'); dibujarResumenVisual(); }
    else if (estadoUI.vistaActual === 'detalle') { document.getElementById('vista-detalle').classList.remove('oculto'); dibujarDetalle(); }
    else { 
        document.getElementById('vista-op').classList.remove('oculto'); 
        document.getElementById('vista-op').innerHTML = dibujarMenuOP();
        const sub = document.getElementById('sub-vista-op');
        if (estadoUI.vistaActual === 'hex') { sub.innerHTML = dibujarHexOP(); updateHexLogText(); }
        else if (estadoUI.vistaActual === 'crear') sub.innerHTML = dibujarFormularioCrear();
    }
}

window.mostrarCatalogo = () => { estadoUI.vistaActual = 'catalogo'; refrescarVistas(); window.scrollTo(0,0); };
window.mostrarResumen = () => { estadoUI.vistaActual = 'resumen'; refrescarVistas(); window.scrollTo(0,0); };
window.abrirDetalle = (nombre) => { estadoUI.personajeSeleccionado = nombre; estadoUI.vistaActual = 'detalle'; refrescarVistas(); window.scrollTo(0,0); };

window.abrirMenuOP = () => { 
    const enrutarOP = () => { estadoUI.vistaActual = 'hex'; refrescarVistas(); };
    if (estadoUI.esAdmin) { enrutarOP(); return; }
    const pass = prompt("Acceso Restringido MÁSTER. Contraseña:");
    if (pass === atob('Y2FuZXk=')) { estadoUI.esAdmin = true; enrutarOP(); } 
};

window.mostrarPaginaOP = (subvista) => { estadoUI.vistaActual = subvista; refrescarVistas(); };
window.setFiltro = (tipo, valor) => { if(tipo === 'rol') estadoUI.filtroRol = valor; if(tipo === 'act') estadoUI.filtroAct = valor; refrescarVistas(); };

window.togglePartyMember = (nombre, isChecked) => {
    if (isChecked) { const e = estadoUI.party.indexOf(null); if (e !== -1) estadoUI.party[e] = nombre; else alert("Máximo de 6 alcanzado."); } 
    else { const c = estadoUI.party.indexOf(nombre); if (c !== -1) estadoUI.party[c] = null; }
    guardar(); repintarConScroll('hex');
};
window.vaciarParty = () => { estadoUI.party = [null, null, null, null, null, null]; guardar(); repintarConScroll('hex'); };
window.establecerPartyActiva = () => {
    if (!estadoUI.party.some(n => n !== null)) return alert("Party vacía.");
    if(!confirm("¿Marcar seleccionados como Activos y el resto Inactivos?")) return;
    Object.keys(statsGlobal).forEach(n => { if (statsGlobal[n].isPlayer) { statsGlobal[n].isActive = false; window.encolarCambio(n); } });
    estadoUI.party.forEach(n => { if (n && statsGlobal[n]) { statsGlobal[n].isPlayer = true; statsGlobal[n].isNPC = false; statsGlobal[n].isActive = true; window.encolarCambio(n); } });
    guardar(); repintarConScroll('hex'); alert("Party actualizada.");
};

window.modHexInd = (nombre, amount) => { 
    const p = statsGlobal[nombre]; if(!p) return; 
    p.hex = Math.max(0, p.hex + amount); 
    window.addHexLogEntry(nombre, amount, false); 
    window.encolarCambio(nombre); 
    guardar(); 
    repintarConScroll('hex'); 
};

window.modHexGlobal = (amount) => {
    if (!estadoUI.party.some(n => n !== null)) return alert("Party vacía.");
    estadoUI.party.forEach(nombre => { 
        if (nombre && statsGlobal[nombre]) { 
            const p = statsGlobal[nombre]; 
            p.hex = Math.max(0, p.hex + amount); 
            window.addHexLogEntry(nombre, amount, false); 
            window.encolarCambio(nombre); 
        } 
    });
    guardar(); repintarConScroll('hex');
};

window.addAsistenciaGlobal = () => {
    if (!estadoUI.party.some(n => n !== null)) return alert("Party vacía.");
    let leveledUp = [];
    estadoUI.party.forEach(nombre => {
        if (nombre && statsGlobal[nombre]) {
            const p = statsGlobal[nombre]; p.asistencia = (p.asistencia || 1) + 1;
            if (p.asistencia >= 8) { p.asistencia = 1; p.hex += 1000; window.addHexLogEntry(nombre, 1000, true); leveledUp.push(nombre); } 
            else { window.addHexLogEntry(nombre, 0, false); }
            window.encolarCambio(nombre);
        }
    });
    guardar(); if (leveledUp.length > 0) alert(`¡ASISTENCIA MÁXIMA ALCANZADA!\n${leveledUp.join(', ')} regresan a Asistencia 1 y ganan +1000 HEX EXTRA.`);
    repintarConScroll('hex');
};

// --- FORMULARIOS CREACIÓN Y EDICIÓN ---
window.toggleCrearRol = () => { const btn = document.getElementById('btn-crear-rol'); if (btn.dataset.val === 'npc') { btn.dataset.val = 'jugador'; btn.innerText = 'ROL: JUGADOR'; btn.style.background = '#004a00'; btn.style.borderColor = '#00ff00'; } else { btn.dataset.val = 'npc'; btn.innerText = 'ROL: NPC'; btn.style.background = '#4a0000'; btn.style.borderColor = '#ff0000'; } };
window.toggleCrearAct = () => { const btn = document.getElementById('btn-crear-act'); if (btn.dataset.val === 'activo') { btn.dataset.val = 'inactivo'; btn.innerText = 'ESTADO: INACTIVO'; btn.style.background = '#4a0000'; btn.style.borderColor = '#ff0000'; } else { btn.dataset.val = 'activo'; btn.innerText = 'ESTADO: ACTIVO'; btn.style.background = '#004a00'; btn.style.borderColor = '#00ff00'; } };
window.updateCreationAfinitySum = () => { const s = ['fis','ene','esp','man','psi','osc'].reduce((acc,id)=>acc+(parseInt(document.getElementById('npc-'+id)?.value)||0),0); const d = document.getElementById('creation-affinity-sum-display'); if(d) d.innerText = `Total Afinidades: ${s}`; };
window.toggleIdentidad = (prop) => { const n = estadoUI.personajeSeleccionado; const p = statsGlobal[n]; if(!p) return; p[prop] = !p[prop]; if (prop === 'isPlayer') p.isNPC = !p.isPlayer; window.encolarCambio(n); guardar(); repintarConScroll('op'); };

window.modificarBuff = (statId, cantidad) => { const n=estadoUI.personajeSeleccionado; const p=statsGlobal[n]; if(!p)return; p.buffs[statId] = (p.buffs[statId]||0)+cantidad; window.encolarCambio(n); guardar(); repintarConScroll('op'); };
window.modBaseTop = (statId, cantidad) => { const n=estadoUI.personajeSeleccionado; const p=statsGlobal[n]; if(!p)return; const prop = `base${statId.charAt(0).toUpperCase() + statId.slice(1)}`; p[prop] = Math.max(0, (p[prop]||0)+cantidad); window.encolarCambio(n); guardar(); repintarConScroll('op'); };
window.modBaseAfin = (statId, cantidad) => { const n=estadoUI.personajeSeleccionado; const p=statsGlobal[n]; if(!p)return; p.afinidadesBase[statId] = Math.max(0, (p.afinidadesBase[statId]||0)+cantidad); window.encolarCambio(n); guardar(); repintarConScroll('op'); };
window.modSpellEffTop = (statId, cantidad) => { const n=estadoUI.personajeSeleccionado; const p=statsGlobal[n]; if(!p)return; p.hechizosEfecto[statId] = (p.hechizosEfecto[statId]||0)+cantidad; window.encolarCambio(n); guardar(); repintarConScroll('op'); };
window.modSpellEffAfin = (statId, cantidad) => { const n=estadoUI.personajeSeleccionado; const p=statsGlobal[n]; if(!p)return; p.hechizosEfecto[statId] = (p.hechizosEfecto[statId]||0)+cantidad; window.encolarCambio(n); guardar(); repintarConScroll('op'); };
window.modLibre = (statId, cantidad) => { const n=estadoUI.personajeSeleccionado; const p=statsGlobal[n]; if(!p)return; p[statId] = Math.max(0, (p[statId]||0)+cantidad); window.encolarCambio(n); guardar(); repintarConScroll('detalle'); };

window.modEstado = (estadoId, cantidad) => { const n=estadoUI.personajeSeleccionado; const p=statsGlobal[n]; if(!p)return; p.estados[estadoId] = Math.max(0, (p.estados[estadoId]||0)+cantidad); window.encolarCambio(n); guardar(); repintarConScroll('op'); };
window.toggleEstado = (estadoId) => { const n=estadoUI.personajeSeleccionado; const p=statsGlobal[n]; if(!p)return; p.estados[estadoId] = !p.estados[estadoId]; window.encolarCambio(n); guardar(); repintarConScroll('op'); };

window.recalcularBases = () => { 
    const n = estadoUI.personajeSeleccionado; const p = statsGlobal[n]; if(!p) return; 
    if(confirm(`¿Recalcular Vidas Teóricas de ${n}?`)) { 
        p.baseVidaRojaMax = 10; 
        p.vidaRojaActual = calcularVidaRojaMax(p); 
        p.baseVidaAzul = getMysticBonus(p); 
        p.vidaAzul = p.baseVidaAzul; 
        window.encolarCambio(n); 
        guardar(); 
        repintarConScroll('op'); 
    } 
};

window.ejecutarClonacion = (tipo) => {
    const s = document.getElementById('clon-source'); if(!s) return; const sn = s.value; if(!sn) return alert("Selecciona origen.");
    const tn = estadoUI.personajeSeleccionado; const orig = statsGlobal[sn]; const dest = statsGlobal[tn];
    if(!confirm(`¿Clonar de ${sn} hacia ${tn}?`)) return;
    if (['estados','completo','stats_puros'].includes(tipo)) dest.estados = JSON.parse(JSON.stringify(orig.estados));
    if (['efectosExtras','completo'].includes(tipo)) { dest.buffs = JSON.parse(JSON.stringify(orig.buffs)); dest.hechizosEfecto = JSON.parse(JSON.stringify(orig.hechizosEfecto||{})); }
    if (['hex','completo','stats_puros'].includes(tipo)) dest.hex = orig.hex;
    if (['completo','stats_puros'].includes(tipo)) { 
        dest.vidaRojaActual = orig.vidaRojaActual; dest.baseVidaRojaMax = orig.baseVidaRojaMax; dest.vidaRojaMax = orig.vidaRojaMax;
        dest.vidaAzul = orig.vidaAzul; dest.baseVidaAzul = orig.baseVidaAzul; dest.guardaDorada = orig.guardaDorada; dest.baseGuardaDorada = orig.baseGuardaDorada;
        dest.afinidadesBase = JSON.parse(JSON.stringify(orig.afinidadesBase)); dest.afinidades = JSON.parse(JSON.stringify(orig.afinidades));
        dest.vex = orig.vex; if(tipo==='completo') dest.iconoOverride = orig.iconoOverride || sn;
    }
    window.encolarCambio(tn); guardar(); s.value = ""; repintarConScroll('op'); 
};

window.ejecutarCreacionNPC = () => {
    const nombre = document.getElementById('npc-nombre').value.trim(); if(!nombre) return alert("Falta nombre.");
    const pV = (id) => parseInt(document.getElementById(id).value)||0;
    let stInit = {}; listaEstados.forEach(e => { stInit[e.id] = (e.tipo === 'numero') ? 0 : false; });
    statsGlobal[nombre] = {
        isPlayer: document.getElementById('btn-crear-rol').dataset.val === 'jugador', isNPC: document.getElementById('btn-crear-rol').dataset.val === 'npc', isActive: document.getElementById('btn-crear-act').dataset.val === 'activo', 
        hex: pV('npc-hex'), asistencia: 1, vex: pV('npc-vex'), vidaRojaActual: pV('npc-vra'), vidaRojaMax: pV('npc-vrm'), baseVidaRojaMax: pV('npc-vrm'),
        vidaAzul: pV('npc-va'), baseVidaAzul: pV('npc-va'), guardaDorada: pV('npc-gd'), baseGuardaDorada: pV('npc-gd'), danoRojo: pV('npc-dr'), baseDanoRojo: pV('npc-dr'),
        afinidades: { fisica:pV('npc-fis'), energetica:pV('npc-ene'), espiritual:pV('npc-esp'), mando:pV('npc-man'), psiquica:pV('npc-psi'), oscura:pV('npc-osc') },
        afinidadesBase: { fisica:pV('npc-fis'), energetica:pV('npc-ene'), espiritual:pV('npc-esp'), mando:pV('npc-man'), psiquica:pV('npc-psi'), oscura:pV('npc-osc') },
        hechizos: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
        hechizosEfecto: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
        buffs: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
        estados: stInit
    };
    window.encolarCambio(nombre); guardar(); estadoUI.personajeSeleccionado = nombre; window.abrirDetalle(nombre); window.scrollTo(0,0);
};

window.descargarAumentada = () => { descargarArchivoCSV(generarCSVExportacion(), "HEX_ESTADOS_AUMENTADO.csv"); };

async function iniciar() {
    try { 
        await cargarDiccionarioEstados(); 
        const cache = localStorage.getItem('hex_stats_v2'); 
        if (!cache) { await cargarTodoDesdeCSV(); } 
        else { 
            const parsed = JSON.parse(cache); 
            Object.assign(statsGlobal, parsed.stats); 
            if(parsed.party) estadoUI.party = parsed.party;
            cargarTodoDesdeCSV(); // Carga las 3 APIs en paralelo de fondo
        } 
    } 
    catch (error) { console.error("Error crítico:", error); } 
    finally { 
        refrescarVistas(); 
        if (estadoUI.vistaActual === 'hex') updateHexLogText();
    }
}
iniciar();

