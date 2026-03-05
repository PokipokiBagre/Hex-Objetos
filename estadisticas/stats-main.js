import { statsGlobal, estadoUI, listaEstados, guardar } from './stats-state.js';
import { cargarTodoDesdeCSV, procesarTextoCSV, cargarDiccionarioEstados } from './stats-data.js';
import { dibujarCatalogo, dibujarDetalle, dibujarMenuOP, dibujarHexOP, dibujarFormularioCrear, dibujarFormularioEditar } from './stats-ui.js';
import { generarCSVExportacion, descargarArchivoCSV, calcularVidaRojaMax, getMysticBonus } from './stats-logic.js';

let formOverrides = { 'npc-vrm': false, 'npc-vra': false, 'npc-va': false };

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
            if (actionType === 'pos' && log.pos.amount >= 0) {
                finalOutput += `${char} +${log.pos.amount} Hex (${log.pos.finalHex})${asisStr}\n`;
            } else if (actionType === 'neg' && log.neg.amount > 0) {
                finalOutput += `${char} -${log.neg.amount} Hex (${log.neg.finalHex})${asisStr}\n`;
            } else if (actionType === 'extra' && log.extra.amount > 0) {
                finalOutput += `${char} +${log.extra.amount} Hex ¡EXTRA! (${log.extra.finalHex})${asisStr}\n`;
            }
        });
    });
    
    textarea.value = finalOutput;
    textarea.scrollTop = textarea.scrollHeight; 
}

window.addHexLogEntry = (nombre, amount, isExtra = false) => {
    const p = statsGlobal[nombre];
    if (!p) return;

    if (!estadoUI.hexLog[nombre]) {
        estadoUI.hexLog[nombre] = { pos: { amount: 0, finalHex: 0 }, neg: { amount: 0, finalHex: 0 }, extra: { amount: 0, finalHex: 0 }, order: [] };
    }

    const log = estadoUI.hexLog[nombre];

    if (isExtra) {
        log.extra.amount += amount; log.extra.finalHex = p.hex; log.order = log.order.filter(k => k !== 'extra'); log.order.push('extra');
    } else if (amount > 0) {
        log.pos.amount += amount; log.pos.finalHex = p.hex; log.order = log.order.filter(k => k !== 'pos'); log.order.push('pos');
    } else if (amount < 0) {
        log.neg.amount += Math.abs(amount); log.neg.finalHex = p.hex; log.order = log.order.filter(k => k !== 'neg'); log.order.push('neg');
    } else if (amount === 0) {
        if (log.order.length === 0) { log.pos.amount = 0; log.pos.finalHex = p.hex; log.order.push('pos'); }
    }
};

window.limpiarHexLog = () => { estadoUI.hexLog = {}; updateHexLogText(); };

window.copiarHexLog = () => {
    const textarea = document.getElementById('hex-log-textarea');
    if (textarea) { textarea.select(); document.execCommand('copy'); alert("Log copiado al portapapeles exitosamente."); }
};

function repintarConScroll(vista) {
    const scrollY = window.scrollY;
    const containerId = vista === 'detalle' ? 'vista-detalle' : 'sub-vista-op';
    const container = document.getElementById(containerId);
    
    if (container) {
        const h = container.getBoundingClientRect().height;
        container.style.minHeight = h + 'px';
        
        if (vista === 'detalle') { dibujarDetalle(); } 
        else {
            if (estadoUI.vistaActual === 'hex') container.innerHTML = dibujarHexOP();
            else if (estadoUI.vistaActual === 'crear') container.innerHTML = dibujarFormularioCrear();
            else container.innerHTML = dibujarFormularioEditar();
        }
        
        if (estadoUI.vistaActual === 'hex') updateHexLogText();
        
        window.scrollTo(0, scrollY);
        requestAnimationFrame(() => container.style.minHeight = '');
    } else {
        refrescarVistas(); window.scrollTo(0, scrollY);
    }
}

function refrescarVistas() {
    document.getElementById('vista-catalogo').classList.add('oculto'); 
    document.getElementById('vista-detalle').classList.add('oculto'); 
    document.getElementById('vista-op').classList.add('oculto');
    
    if (estadoUI.vistaActual === 'catalogo') { document.getElementById('vista-catalogo').classList.remove('oculto'); dibujarCatalogo(); }
    else if (estadoUI.vistaActual === 'detalle') { document.getElementById('vista-detalle').classList.remove('oculto'); dibujarDetalle(); }
    else { 
        document.getElementById('vista-op').classList.remove('oculto'); 
        document.getElementById('vista-op').innerHTML = dibujarMenuOP();
        const sub = document.getElementById('sub-vista-op');
        
        if (estadoUI.vistaActual === 'hex') { sub.innerHTML = dibujarHexOP(); updateHexLogText(); }
        else if (estadoUI.vistaActual === 'crear') sub.innerHTML = dibujarFormularioCrear();
        else sub.innerHTML = dibujarFormularioEditar();
    }
}

window.mostrarCatalogo = () => { estadoUI.vistaActual = 'catalogo'; refrescarVistas(); window.scrollTo(0,0); };
window.abrirDetalle = (nombre) => { estadoUI.personajeSeleccionado = nombre; estadoUI.vistaActual = 'detalle'; refrescarVistas(); window.scrollTo(0,0); };

window.abrirMenuOP = () => { 
    const enrutarOP = () => { estadoUI.vistaActual = 'hex'; refrescarVistas(); };
    if (estadoUI.esAdmin) { enrutarOP(); return; }
    const pass = prompt("Acceso Restringido. Contraseña:");
    if (pass === atob('Y2FuZXk=')) { estadoUI.esAdmin = true; enrutarOP(); } else { if(pass !== null) alert("Acceso denegado."); }
};

window.mostrarPaginaOP = (subvista) => { estadoUI.vistaActual = subvista; refrescarVistas(); };
window.setFiltro = (tipo, valor) => { if(tipo === 'rol') estadoUI.filtroRol = valor; if(tipo === 'act') estadoUI.filtroAct = valor; refrescarVistas(); };

window.togglePartyMember = (nombre, isChecked) => {
    if (isChecked) {
        const emptyIndex = estadoUI.party.indexOf(null);
        if (emptyIndex !== -1) { estadoUI.party[emptyIndex] = nombre; } 
        else { alert("¡La party ya tiene el máximo de 6 jugadores! Desmarca a uno primero."); }
    } else {
        const charIndex = estadoUI.party.indexOf(nombre);
        if (charIndex !== -1) { estadoUI.party[charIndex] = null; }
    }
    guardar(); repintarConScroll('hex');
};

window.vaciarParty = () => { estadoUI.party = [null, null, null, null, null, null]; guardar(); repintarConScroll('hex'); };

window.establecerPartyActiva = () => {
    const hayParty = estadoUI.party.some(n => n !== null);
    if (!hayParty) return alert("¡No hay nadie marcado! Marca jugadores en la lista primero.");
    if(!confirm("Esto marcará a los personajes seleccionados como 'Activos' y al resto de jugadores como 'Inactivos'. ¿Proceder?")) return;
    Object.keys(statsGlobal).forEach(n => { if (statsGlobal[n].isPlayer) statsGlobal[n].isActive = false; });
    estadoUI.party.forEach(n => { if (n && statsGlobal[n]) { statsGlobal[n].isPlayer = true; statsGlobal[n].isNPC = false; statsGlobal[n].isActive = true; } });
    guardar(); repintarConScroll('hex'); alert("Party actualizada correctamente.");
};

window.modHexInd = (nombre, amount) => { const p = statsGlobal[nombre]; if(!p) return; p.hex = Math.max(0, p.hex + amount); window.addHexLogEntry(nombre, amount, false); guardar(); repintarConScroll('hex'); };

window.modHexGlobal = (amount) => {
    const hayParty = estadoUI.party.some(n => n !== null);
    if (!hayParty) return alert("¡La Party está vacía! Marca jugadores primero.");
    estadoUI.party.forEach(nombre => {
        if (nombre && statsGlobal[nombre]) {
            const p = statsGlobal[nombre]; p.hex = Math.max(0, p.hex + amount); window.addHexLogEntry(nombre, amount, false);
        }
    });
    guardar(); repintarConScroll('hex');
};

window.addAsistenciaGlobal = () => {
    const hayParty = estadoUI.party.some(n => n !== null);
    if (!hayParty) return alert("¡La Party está vacía! Marca jugadores primero.");
    let leveledUp = [];
    estadoUI.party.forEach(nombre => {
        if (nombre && statsGlobal[nombre]) {
            const p = statsGlobal[nombre];
            p.asistencia = (p.asistencia || 1) + 1;
            if (p.asistencia >= 8) {
                p.asistencia = 1; p.hex += 1000; window.addHexLogEntry(nombre, 1000, true); leveledUp.push(nombre);
            } else { window.addHexLogEntry(nombre, 0, false); }
        }
    });
    guardar(); 
    if (leveledUp.length > 0) { alert(`¡ASISTENCIA MÁXIMA ALCANZADA!\n\nLos siguientes personajes han regresado a Asistencia 1 y ganado +1000 HEX EXTRA:\n\n${leveledUp.join(', ')}`); }
    repintarConScroll('hex');
};

window.toggleCrearRol = () => {
    const btn = document.getElementById('btn-crear-rol');
    if (btn.dataset.val === 'npc') { btn.dataset.val = 'jugador'; btn.innerText = 'ROL: JUGADOR'; btn.style.background = '#004a00'; btn.style.borderColor = '#00ff00'; } 
    else { btn.dataset.val = 'npc'; btn.innerText = 'ROL: NPC'; btn.style.background = '#4a0000'; btn.style.borderColor = '#ff0000'; }
};

window.toggleCrearAct = () => {
    const btn = document.getElementById('btn-crear-act');
    if (btn.dataset.val === 'activo') { btn.dataset.val = 'inactivo'; btn.innerText = 'ESTADO: INACTIVO'; btn.style.background = '#4a0000'; btn.style.borderColor = '#ff0000'; } 
    else { btn.dataset.val = 'activo'; btn.innerText = 'ESTADO: ACTIVO'; btn.style.background = '#004a00'; btn.style.borderColor = '#00ff00'; }
};

window.updateCreationAfinitySum = () => {
    const fis = parseInt(document.getElementById('npc-fis')?.value) || 0; const ene = parseInt(document.getElementById('npc-ene')?.value) || 0;
    const esp = parseInt(document.getElementById('npc-esp')?.value) || 0; const man = parseInt(document.getElementById('npc-man')?.value) || 0;
    const psi = parseInt(document.getElementById('npc-psi')?.value) || 0; const osc = parseInt(document.getElementById('npc-osc')?.value) || 0;
    const display = document.getElementById('creation-affinity-sum-display');
    if(display) display.innerText = `Total Afinidades: ${fis + ene + esp + man + psi + osc}`;
};

window.toggleIdentidad = (prop) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; p[prop] = !p[prop]; if (prop === 'isPlayer') p.isNPC = !p.isPlayer; guardar(); repintarConScroll('op'); };

// ==========================================
// EL MOTOR REPARADO QUE ESCUCHA TUS CLICS
// ==========================================
function recalcularVidas(p, accion) {
    const prevRojo = calcularVidaRojaMax(p);
    
    // Foto de Magia Total antes del clic
    const calcMagTotal = () => ((p.afinidades?.energetica||0) + (p.hechizos?.energetica||0) + (p.hechizosEfecto?.energetica||0) + (p.buffs?.energetica||0)) + ((p.afinidades?.espiritual||0) + (p.hechizos?.espiritual||0) + (p.hechizosEfecto?.espiritual||0) + (p.buffs?.espiritual||0)) + ((p.afinidades?.mando||0) + (p.hechizos?.mando||0) + (p.hechizosEfecto?.mando||0) + (p.buffs?.mando||0)) + ((p.afinidades?.psiquica||0) + (p.hechizos?.psiquica||0) + (p.hechizosEfecto?.psiquica||0) + (p.buffs?.psiquica||0));
    const prevMag = Math.floor(calcMagTotal() / 4);

    accion(); // Aquí se aplica el +120 Física o Magia de tus botones

    // Comprobamos la vida y magia después del clic
    const newRojo = calcularVidaRojaMax(p);
    const newMag = Math.floor(calcMagTotal() / 4);
    
    const deltaRojo = newRojo - prevRojo;
    const deltaMystic = newMag - prevMag;
    
    // Si subiste de límite rojo, ¡te cura!
    if (deltaRojo !== 0) p.vidaRojaActual = Math.max(0, (p.vidaRojaActual || 0) + deltaRojo);
    
    // Si subiste de magia, ¡te da corazones azules!
    if (deltaMystic !== 0) p.vidaAzul = Math.max(0, (p.vidaAzul || 0) + deltaMystic);
    
    const finalMax = calcularVidaRojaMax(p);
    if (p.vidaRojaActual > finalMax) p.vidaRojaActual = finalMax;
}

window.recalcularBases = () => {
    const p = statsGlobal[estadoUI.personajeSeleccionado];
    if(!p) return;
    if(confirm(`¿Seguro que deseas RECALCULAR las vidas bases de ${estadoUI.personajeSeleccionado}?\n\nEsto pondrá el Límite Rojo a 10 (para aplicar la física pura), la Vida Azul a su equivalente mágico y lo curará al máximo.`)) {
        p.vidaRojaMax = 10;
        p.vidaRojaActual = calcularVidaRojaMax(p);
        p.vidaAzul = getMysticBonus(p);
        p.baseVidaAzul = p.vidaAzul;
        guardar();
        repintarConScroll('detalle');
    }
};

window.cambioManual = (statId, valorStr, tipoAccion) => {
    const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return;
    let val = parseInt(valorStr); if (isNaN(val)) val = 0; 
    recalcularVidas(p, () => {
        if (tipoAccion === 'buff') p.buffs[statId] = val;
        else if (tipoAccion === 'baseTop') p[statId] = Math.max(0, val);
        else if (tipoAccion === 'baseAfin') p.afinidades[statId] = Math.max(0, val);
        else if (tipoAccion === 'spellTop' || tipoAccion === 'spellAfin') p.hechizos[statId] = val;
        else if (tipoAccion === 'spellEffTop' || tipoAccion === 'spellEffAfin') p.hechizosEfecto[statId] = val;
        else if (tipoAccion === 'directo') p[statId] = Math.max(0, val);
    });
    guardar();
    if (estadoUI.vistaActual === 'detalle') repintarConScroll('detalle'); else repintarConScroll('op');
};

window.modificarBuff = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; recalcularVidas(p, () => { p.buffs[statId] = (p.buffs[statId] || 0) + cantidad; }); guardar(); repintarConScroll('detalle'); };
window.modBaseTop = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; recalcularVidas(p, () => { p[statId] = Math.max(0, (p[statId] || 0) + cantidad); }); guardar(); repintarConScroll('op'); };
window.modBaseAfin = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; recalcularVidas(p, () => { p.afinidades[statId] = Math.max(0, (p.afinidades[statId] || 0) + cantidad); }); guardar(); repintarConScroll('op'); };
window.modSpellTop = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; recalcularVidas(p, () => { p.hechizos[statId] = (p.hechizos[statId] || 0) + cantidad; }); guardar(); repintarConScroll('op'); };
window.modSpellAfin = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; recalcularVidas(p, () => { p.hechizos[statId] = (p.hechizos[statId] || 0) + cantidad; }); guardar(); repintarConScroll('op'); };
window.modSpellEffTop = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; recalcularVidas(p, () => { p.hechizosEfecto[statId] = (p.hechizosEfecto[statId] || 0) + Math.max(-Math.abs(p.hechizosEfecto[statId] || 0), Math.min(Math.abs(p.hechizosEfecto[statId] || 0), cantidad)); }); guardar(); repintarConScroll('op'); };
window.modSpellEffAfin = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; recalcularVidas(p, () => { p.hechizosEfecto[statId] = (p.hechizosEfecto[statId] || 0) + cantidad; }); guardar(); repintarConScroll('op'); };
window.modificarDirecto = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; p[statId] = Math.max(0, (p[statId] || 0) + cantidad); guardar(); repintarConScroll('op'); };
window.modLibre = (statId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; p[statId] = Math.max(0, (p[statId] || 0) + cantidad); guardar(); repintarConScroll('detalle'); };

window.modBlueExtra = (cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; p.buffs.vidaAzulExtra = Math.max(0, (p.buffs.vidaAzulExtra || 0) + cantidad); p.vidaAzul = Math.max(0, (p.vidaAzul || 0) + cantidad); guardar(); repintarConScroll('detalle'); };
window.modGoldExtra = (cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; p.buffs.guardaDoradaExtra = Math.max(0, (p.buffs.guardaDoradaExtra || 0) + cantidad); p.guardaDorada = Math.max(0, (p.guardaDorada || 0) + cantidad); guardar(); repintarConScroll('detalle'); };

window.checkFormOverrides = (inputId) => {
    if (['npc-vrm', 'npc-vra', 'npc-va'].includes(inputId)) formOverrides[inputId] = true;
    const fis = parseInt(document.getElementById('npc-fis')?.value) || 0;
    const ene = parseInt(document.getElementById('npc-ene')?.value) || 0;
    const esp = parseInt(document.getElementById('npc-esp')?.value) || 0;
    const man = parseInt(document.getElementById('npc-man')?.value) || 0;
    const psi = parseInt(document.getElementById('npc-psi')?.value) || 0;

    const calcVrm = 10 + Math.floor(fis / 2);
    const calcVa = Math.floor((ene + esp + man + psi) / 4);

    if (!formOverrides['npc-vrm']) { const elVrm = document.getElementById('npc-vrm'); if (elVrm && elVrm.value != calcVrm) elVrm.value = calcVrm; }
    if (!formOverrides['npc-vra']) { const elVra = document.getElementById('npc-vra'); const targetVra = formOverrides['npc-vrm'] ? parseInt(document.getElementById('npc-vrm')?.value || 10) : calcVrm; if (elVra && elVra.value != targetVra) elVra.value = targetVra; }
    if (!formOverrides['npc-va']) { const elVa = document.getElementById('npc-va'); if (elVa && elVa.value != calcVa) elVa.value = calcVa; }
};

window.modFormInput = (inputId) => { window.checkFormOverrides(inputId); };
window.modForm = (inputId, cantidad) => { const input = document.getElementById(inputId); if(input) { let val = parseInt(input.value) || 0; input.value = Math.max(0, val + cantidad); window.checkFormOverrides(inputId); } };
window.modEstado = (estadoId, cantidad) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; p.estados[estadoId] = Math.max(0, (p.estados[estadoId] || 0) + cantidad); guardar(); repintarConScroll('op'); };
window.toggleEstado = (estadoId) => { const p = statsGlobal[estadoUI.personajeSeleccionado]; if(!p) return; p.estados[estadoId] = !p.estados[estadoId]; guardar(); repintarConScroll('op'); };

window.ejecutarClonacion = (tipo) => {
    const sourceSelect = document.getElementById('clon-source'); if(!sourceSelect) return;
    const sourceName = sourceSelect.value; if(!sourceName) { alert("Por favor, selecciona un personaje de origen."); return; }
    const targetName = estadoUI.personajeSeleccionado; 
    const source = statsGlobal[sourceName]; const target = statsGlobal[targetName];
    
    let msg = '';
    if (tipo === 'estados') msg = `¿Seguro que deseas IMPORTAR solo los ESTADOS ALTERADOS desde ${sourceName} hacia ${targetName}?`;
    else if (tipo === 'efectosExtras') msg = `¿Seguro que deseas COPIAR LOS EFECTOS DE HECHIZOS Y BUFFS EXTRAS desde ${sourceName} hacia ${targetName}?`;
    else if (tipo === 'hex') msg = `¿Seguro que deseas COPIAR EL HEX (${source.hex}) desde ${sourceName} hacia ${targetName}?\n(El HEX actual de ${targetName} se sobrescribirá).`;
    else if (tipo === 'completo') msg = `¿Seguro que deseas CLONAR POR COMPLETO a ${sourceName} sobre ${targetName}?\n\n(Esto copiará estadísticas, afinidades, estados e IMÁGENES. El personaje ${targetName} se verá como ${sourceName}).`;
    else if (tipo === 'stats_puros') msg = `¿Seguro que deseas IMPORTAR TODA LA FICHA desde ${sourceName} hacia ${targetName}?\n\n(No se copiará la imagen).`;
    if(!confirm(msg)) return;

    if (tipo === 'estados' || tipo === 'completo' || tipo === 'stats_puros') { target.estados = JSON.parse(JSON.stringify(source.estados)); }
    if (tipo === 'efectosExtras' || tipo === 'completo') {
        target.buffs = JSON.parse(JSON.stringify(source.buffs));
        target.hechizosEfecto = JSON.parse(JSON.stringify(source.hechizosEfecto || {}));
    }
    if (tipo === 'hex' || tipo === 'completo' || tipo === 'stats_puros') { target.hex = source.hex; }
    if (tipo === 'completo' || tipo === 'stats_puros') {
        target.vidaRojaActual = source.vidaRojaActual; target.vidaRojaMax = source.vidaRojaMax;
        target.vidaAzul = source.vidaAzul; target.baseVidaAzul = source.baseVidaAzul; 
        target.guardaDorada = source.guardaDorada; target.baseGuardaDorada = source.baseGuardaDorada;
        target.danoRojo = source.danoRojo; target.danoAzul = source.danoAzul; target.elimDorada = source.elimDorada;
        target.afinidades = JSON.parse(JSON.stringify(source.afinidades));
        target.hechizos = JSON.parse(JSON.stringify(source.hechizos || {}));
        target.vex = source.vex;
        if (tipo === 'completo') target.iconoOverride = source.iconoOverride || normalizar(sourceName);
    }
    guardar(); sourceSelect.value = ""; repintarConScroll('detalle'); 
};

window.ejecutarCreacionNPC = () => {
    const nombre = document.getElementById('npc-nombre').value.trim();
    if(!nombre) return alert("Falta dar un nombre.");
    const isPlayer = document.getElementById('btn-crear-rol').dataset.val === 'jugador';
    const isActive = document.getElementById('btn-crear-act').dataset.val === 'activo';
    const fis = parseInt(document.getElementById('npc-fis').value) || 0;
    const ene = parseInt(document.getElementById('npc-ene').value) || 0;
    const esp = parseInt(document.getElementById('npc-esp').value) || 0;
    const man = parseInt(document.getElementById('npc-man').value) || 0;
    const psi = parseInt(document.getElementById('npc-psi').value) || 0;
    const osc = parseInt(document.getElementById('npc-osc').value) || 0;
    const inputVrm = parseInt(document.getElementById('npc-vrm').value) || 0;
    const inputVa = parseInt(document.getElementById('npc-va').value) || 0;
    const inputVra = parseInt(document.getElementById('npc-vra').value) || 0;
    const guardaD = parseInt(document.getElementById('npc-gd').value) || 0;
    
    let stInit = {}; listaEstados.forEach(e => { stInit[e.id] = (e.tipo === 'numero') ? 0 : false; });

    statsGlobal[nombre] = {
        isPlayer: isPlayer, isNPC: !isPlayer, isActive: isActive, 
        hex: parseInt(document.getElementById('npc-hex').value) || 0, asistencia: 1, vex: parseInt(document.getElementById('npc-vex').value) || 0,
        vidaRojaActual: inputVra, vidaRojaMax: inputVrm, 
        vidaAzul: inputVa, baseVidaAzul: inputVa, 
        guardaDorada: guardaD, baseGuardaDorada: guardaD,
        danoRojo: parseInt(document.getElementById('npc-dr').value) || 0, 
        danoAzul: parseInt(document.getElementById('npc-da').value) || 0, elimDorada: parseInt(document.getElementById('npc-ed').value) || 0,
        afinidades: { fisica: fis, energetica: ene, espiritual: esp, mando: man, psiquica: psi, oscura: osc },
        hechizos: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
        hechizosEfecto: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
        buffs: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
        estados: stInit
    };
    guardar(); estadoUI.personajeSeleccionado = nombre; window.abrirDetalle(nombre); window.scrollTo(0,0);
};

window.toggleSync = () => {
    estadoUI.modoSincronizado = !estadoUI.modoSincronizado;
    const btn = document.getElementById('btn-sync');
    if (btn) {
        btn.innerText = estadoUI.modoSincronizado ? "CONECTADO A LA DATA" : "DESCONECTADO (EDICIÓN)";
        btn.style.background = estadoUI.modoSincronizado ? "#004a00" : "#4a0000";
        btn.style.borderColor = estadoUI.modoSincronizado ? "#00ff00" : "#ff0000";
    }
    guardar();
};

setInterval(async () => {
    if (estadoUI.modoSincronizado) { await cargarTodoDesdeCSV(); refrescarVistas(); }
}, 10000); 

window.forzarSincronizacion = async () => {
    if(confirm("¿Seguro que deseas Actualizar Manualmente? Esto borrará los NPCs locales.")) {
        const prevScroll = window.scrollY; await cargarTodoDesdeCSV(); 
        if (estadoUI.personajeSeleccionado && !statsGlobal[estadoUI.personajeSeleccionado]) { window.mostrarCatalogo(); } 
        else { refrescarVistas(); window.scrollTo(0, prevScroll); }
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

async function iniciar() {
    try { 
        await cargarDiccionarioEstados(); 
        const cache = localStorage.getItem('hex_stats_v2'); 
        if (!cache) { await cargarTodoDesdeCSV(); } 
        else { 
            const parsed = JSON.parse(cache); 
            Object.assign(statsGlobal, parsed.stats); 
            if(parsed.party) estadoUI.party = parsed.party;
            if(parsed.modoSync !== undefined) estadoUI.modoSincronizado = parsed.modoSync;
        } 
    } 
    catch (error) { console.error("Error crítico:", error); } 
    finally { 
        const btn = document.getElementById('btn-sync');
        if(btn) {
            btn.innerText = estadoUI.modoSincronizado ? "CONECTADO A LA DATA" : "DESCONECTADO (EDICIÓN)";
            btn.style.background = estadoUI.modoSincronizado ? "#004a00" : "#4a0000";
            btn.style.borderColor = estadoUI.modoSincronizado ? "#00ff00" : "#ff0000";
        }
        refrescarVistas(); 
        if (estadoUI.vistaActual === 'hex') updateHexLogText();
    }
}
iniciar();
