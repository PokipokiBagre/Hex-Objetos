import { statsGlobal, listaEstados, estadoUI, dbExtra } from './stats-state.js';
import { calcularVidaRojaMax, calcularVexMax, getMayorAfinidad } from './stats-logic.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
const calcTotal = (base, spells, spellEff, buff) => (base || 0) + (spells || 0) + (spellEff || 0) + (buff || 0);

// Nomenclatura Exacta (Hcz, Alt, Ext)
const bTextSplit = (spells, spellEff, buff) => {
    let parts = [];
    if (spells !== 0) parts.push(`<span style="color:var(--cyan-magic); font-weight:bold;">Hcz: ${spells > 0 ? '+' : ''}${spells}</span>`);
    if (spellEff !== 0) parts.push(`<span style="color:#4a90e2; font-weight:bold;">Alt: ${spellEff > 0 ? '+' : ''}${spellEff}</span>`);
    if (buff !== 0) parts.push(`<span style="color:${buff > 0 ? '#00ff00' : '#ff4444'}; font-weight:bold;">Ext: ${buff > 0 ? '+' : ''}${buff}</span>`);
    
    if (parts.length === 0) return '';
    return `<div style="font-size:0.75em; display:flex; flex-direction:column; gap:2px; margin-top:5px; border-top:1px dashed #555; padding-top:5px;">${parts.join('')}</div>`;
};

const imgError = "this.onerror=null; this.src='../img/imgobjetos/no_encontrado.png'";

function AsegurarGuardaD(p) { if(p.guardaDorada === undefined) p.guardaDorada = 0; if(p.baseGuardaDorada === undefined) p.baseGuardaDorada = 0; }

function asegurarEstructuras(p) {
    AsegurarGuardaD(p);
    if(!p.buffs) p.buffs = {}; if(!p.hechizos) p.hechizos = {}; if(!p.hechizosEfecto) p.hechizosEfecto = {}; if(!p.estados) p.estados = {};
    listaEstados.forEach(e => { if (p.estados[e.id] === undefined) p.estados[e.id] = (e.tipo === 'numero') ? 0 : false; });
    const props = ['fisica', 'energetica', 'espiritual', 'mando', 'psiquica', 'oscura', 'danoRojo', 'danoAzul', 'elimDorada', 'vidaRojaMaxExtra', 'vidaAzulExtra', 'guardaDoradaExtra'];
    props.forEach(pr => { p.buffs[pr] = p.buffs[pr] || 0; p.hechizos[pr] = p.hechizos[pr] || 0; p.hechizosEfecto[pr] = p.hechizosEfecto[pr] || 0; if (p.afinidades && p.afinidades[pr] === undefined) p.afinidades[pr] = 0; if(p.afinidadesBase && p.afinidadesBase[pr] === undefined) p.afinidadesBase[pr] = 0;});
    if(p.isActive === undefined) p.isActive = true;
}

// Generador universal de vidas con símbolos visuales
function generarVidasHTML(p) {
    const maxRojo = calcularVidaRojaMax(p);
    let normalRojo = Math.min(p.vidaRojaActual, maxRojo); let vaciosRojo = Math.max(0, maxRojo - normalRojo); let extraRojo = Math.max(0, p.vidaRojaActual - maxRojo);
    let rojasHTML = ''; for(let i=0; i<normalRojo; i++) rojasHTML += `<div class="heart-red"></div>`; for(let i=0; i<vaciosRojo; i++) rojasHTML += `<div class="heart-red empty"></div>`; for(let i=0; i<extraRojo; i++) rojasHTML += `<div class="heart-red" style="background:#800000; border:1px solid #ff0000; transform:scale(0.9);"></div>`;
    
    const azulTotal = calcTotal(p.baseVidaAzul, p.hechizos.vidaAzulExtra, p.hechizosEfecto.vidaAzulExtra, p.buffs.vidaAzulExtra);
    let azulesHTML = ''; for(let i=0; i<azulTotal; i++) azulesHTML += `<div class="heart-blue"></div>`;
    
    const guardaTotal = calcTotal(p.baseGuardaDorada, p.hechizos.guardaDoradaExtra, p.hechizosEfecto.guardaDoradaExtra, p.buffs.guardaDoradaExtra);
    let guardasHTML = ''; for(let i=0; i<guardaTotal; i++) guardasHTML += `<div class="guard-gold"></div>`;
    
    return { rojasHTML, azulesHTML, guardasHTML, maxRojo, azulTotal, guardaTotal };
}

export function dibujarCatalogo() {
    const contenedor = document.getElementById('vista-catalogo'); contenedor.className = ''; 
    estadoUI.filtroRol = estadoUI.filtroRol || 'Todos'; estadoUI.filtroAct = estadoUI.filtroAct || 'Todos';

    let html = `
    <div style="display:flex; justify-content:center; gap:20px; margin-bottom:20px; flex-wrap:wrap; border-bottom:1px dashed #d4af37; padding-bottom:15px;">
        <div class="filter-group" style="margin:0;">
            <button onclick="window.setFiltro('rol', 'Todos')" class="${estadoUI.filtroRol === 'Todos' ? 'btn-active' : ''}">Todos</button>
            <button onclick="window.setFiltro('rol', 'Jugador')" class="${estadoUI.filtroRol === 'Jugador' ? 'btn-active' : ''}">Jugadores</button>
            <button onclick="window.setFiltro('rol', 'NPC')" class="${estadoUI.filtroRol === 'NPC' ? 'btn-active' : ''}">NPCs</button>
        </div>
        <div class="filter-group" style="margin:0;">
            <button onclick="window.setFiltro('act', 'Todos')" class="${estadoUI.filtroAct === 'Todos' ? 'btn-active' : ''}">Ambos</button>
            <button onclick="window.setFiltro('act', 'Activo')" class="${estadoUI.filtroAct === 'Activo' ? 'btn-active' : ''}">Vivos / Activos</button>
            <button onclick="window.setFiltro('act', 'Inactivo')" class="${estadoUI.filtroAct === 'Inactivo' ? 'btn-active' : ''}">Muertos / Inactivos</button>
        </div>
    </div>
    <div class="catalogo-grid">`;

    const getSortValue = (p) => { if (p.isPlayer && p.isActive) return 1; if (!p.isPlayer && p.isActive) return 2; if (!p.isPlayer && !p.isActive) return 3; if (p.isPlayer && !p.isActive) return 4; return 5; };
    const sortedNames = Object.keys(statsGlobal).sort((a, b) => { const valA = getSortValue(statsGlobal[a]); const valB = getSortValue(statsGlobal[b]); if (valA !== valB) return valA - valB; return a.localeCompare(b); });

    sortedNames.forEach(nombre => {
        const p = statsGlobal[nombre]; asegurarEstructuras(p);
        if (estadoUI.filtroRol === 'Jugador' && !p.isPlayer) return; if (estadoUI.filtroRol === 'NPC' && p.isPlayer) return;
        if (estadoUI.filtroAct === 'Activo' && !p.isActive) return; if (estadoUI.filtroAct === 'Inactivo' && p.isActive) return;

        const iconoMuestra = normalizar(p.iconoOverride || nombre);
        let borderStyle = ""; let bgStyle = "background: #1e0535;"; 
        if (p.isPlayer && p.isActive) { borderStyle = "border: 2px solid var(--gold); box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);"; } 
        else if (!p.isPlayer && p.isActive) { borderStyle = "border: 2px solid #00ffff; box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);"; bgStyle = "background: #0a1128;"; } 
        else if (!p.isPlayer && !p.isActive) { borderStyle = "border: 2px solid #555555;"; bgStyle = "background: #111111;"; } 
        else if (p.isPlayer && !p.isActive) { borderStyle = "border: 2px solid #cc0000; box-shadow: 0 0 10px rgba(204, 0, 0, 0.3);"; bgStyle = "background: #220000;"; }

        const claseInactiva = p.isActive ? '' : 'inactive-card';
        html += `<div class="char-card ${claseInactiva}" style="${borderStyle} ${bgStyle}" onclick="window.abrirDetalle('${nombre}')"><img src="../img/imgpersonajes/${iconoMuestra}icon.png" onerror="${imgError}"><h3>${nombre}</h3><p>HEX: <strong>${p.hex}</strong> | VEX: <strong>${calcularVexMax(p)}</strong></p></div>`;
    }); 
    contenedor.innerHTML = html + `</div>`;
}

// RESUMEN VISUAL (2 Columnas - Click Global para abrir ficha)
export function dibujarResumenVisual() {
    const contenedor = document.getElementById('vista-resumen');
    let html = `<h2 style="text-align:center; color:var(--gold); margin-bottom:30px; text-shadow:0 0 10px rgba(212,175,55,0.8);">Resumen Global del Grupo</h2>
                <div class="resumen-grid">`;

    const afiMap = { 'Física':'fisica', 'Energética':'energetica', 'Espiritual':'espiritual', 'Mando':'mando', 'Psíquica':'psiquica', 'Oscura':'oscura' };

    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        if(!p.isPlayer || !p.isActive) return; 
        
        const iconoGrande = normalizar(p.iconoOverride || nombre);
        const objCount = dbExtra.objetos[nombre.toLowerCase()] || 0;
        const mySpells = (dbExtra.hechizos.inventario || []).filter(i => i.Personaje.toLowerCase() === nombre.toLowerCase());
        
        const mayorAf = getMayorAfinidad(p);
        const mKey = afiMap[mayorAf] || 'fisica';
        const calcAfT = (k) => (p.afinidadesBase[k]||0)+(p.hechizos[k]||0)+(p.hechizosEfecto[k]||0)+(p.buffs[k]||0);
        
        const valMayorAf = calcAfT(mKey);
        const sumAf = ['fisica','energetica','espiritual','mando','psiquica','oscura'].reduce((a,k)=>a+calcAfT(k),0);
        
        const vidas = generarVidasHTML(p);
        const vexVisual = calcularVexMax(p);

        // El fondo entero es clicleable para ir a la ficha
        html += `
        <div class="resumen-row" onclick="window.abrirDetalle('${nombre}')">
            <div class="resumen-left">
                <img src="../img/imgpersonajes/${iconoGrande}icon.png" onerror="${imgError}">
                <h3 style="margin:8px 0 0 0; font-size:1.1em; color:var(--gold); text-transform:uppercase;">${nombre}</h3>
                <div class="copy-wrap hex-label" onclick="window.copySilently('HEX: ${p.hex}', event)">
                    ${p.hex} HEX
                </div>
                <div class="copy-wrap vex-label" onclick="window.copySilently('VEX: ${vexVisual}', event)">
                    ${vexVisual} VEX
                </div>
            </div>
            
            <div class="resumen-right">
                <div class="resumen-badges">
                    <span class="copy-wrap" style="background:#1a1a00; border:1px solid var(--gold);" onclick="window.copySilently('Afinidad: ${mayorAf} (${valMayorAf}) | Suma: ${sumAf}', event)">
                        ✨ Afinidad Primaria: <b style="color:var(--gold)">${mayorAf} (${valMayorAf})</b> | Suma: ${sumAf}
                    </span>
                </div>
                
                <div class="resumen-badges" style="margin-top:10px; background:#000; padding:10px; border-radius:8px; border:1px dashed #444; width:fit-content;">
                    <div class="copy-wrap health-grid" onclick="window.copySilently('Vida Roja: ${p.vidaRojaActual}/${vidas.maxRojo}', event)" style="margin:0;">
                        ${vidas.rojasHTML}
                    </div>
                    ${vidas.azulesHTML ? `<div class="copy-wrap health-grid" onclick="window.copySilently('Vida Azul: ${vidas.azulTotal}', event)" style="margin:0; border-left:1px solid #333; padding-left:15px;">${vidas.azulesHTML}</div>` : ''}
                    ${vidas.guardasHTML ? `<div class="copy-wrap health-grid" onclick="window.copySilently('Guardas: ${vidas.guardaTotal}', event)" style="margin:0; border-left:1px solid #333; padding-left:15px;">${vidas.guardasHTML}</div>` : ''}
                </div>
                
                <div class="resumen-badges" style="margin-top:5px; align-items:center;">
                    <span style="background:#0a1128; border:1px solid #00ffff;">🎒 Objetos: <b style="color:#00ffff">${objCount}</b></span>
                    <span style="background:#110022; border:1px solid var(--cyan-magic);">📖 Hechizos: <b style="color:var(--cyan-magic)">${mySpells.length}</b></span>
                </div>
            </div>
        </div>`;
    });
    html += `</div>`;
    contenedor.innerHTML = html;
}

export function dibujarDetalle() {
    const nombre = estadoUI.personajeSeleccionado; const p = statsGlobal[nombre];
    if(!p) return; asegurarEstructuras(p);
    const contenedor = document.getElementById('vista-detalle');

    let hexPercent = Math.min((p.hex / 4000) * 100, 100); 
    let vexVisual = calcularVexMax(p);
    let vexPercent = Math.min(((vexVisual||0) / 4000) * 100, 100);
    const vidas = generarVidasHTML(p);

    let estadosHTML = ''; 
    if (p.iconoOverride) estadosHTML += `<div class="status-badge" style="background:#2e004f; border: 1px dashed var(--gold); color:var(--gold);">COPIA DE: ${p.iconoOverride.toUpperCase()}</div>`;
    
    listaEstados.forEach(e => {
        let val = p.estados[e.id];
        // Aquí usa la descripción (e.desc) traída limpiamente del CSV
        if (e.tipo === 'numero' && val > 0) estadosHTML += `<div class="status-badge" style="background:${e.bg}; border-color:${e.border}; color:#fff;">${e.nombre} (${val})<span class="tooltiptext">${e.desc}</span></div>`;
        else if (e.tipo === 'booleano' && val) { let colorTexto = e.id === 'huesos' ? '#000' : '#fff'; let bStyle = e.id === 'secuestrado' ? 'dashed' : 'solid'; estadosHTML += `<div class="status-badge" style="background:${e.bg}; border: 1px ${bStyle} ${e.border}; color:${colorTexto};">${e.nombre}<span class="tooltiptext">${e.desc}</span></div>`; }
    });

    const iconoGrande = normalizar(p.iconoOverride || nombre);
    let asisUI = p.isPlayer ? `<div style="color:#aaa; font-size:0.8em; margin-top:5px; font-weight:bold;">ASISTENCIA: <span style="color:#b8860b;">${p.asistencia || 1}/7</span></div>` : '';

    const pjNameLower = nombre.toLowerCase();
    const countObj = dbExtra.objetos[pjNameLower] || 0;
    const mySpells = (dbExtra.hechizos.inventario || []).filter(i => i.Personaje.toLowerCase() === pjNameLower).sort((a,b) => a.Hechizo.localeCompare(b.Hechizo));
    
    const afiMap = { 'Física':'fisica', 'Energética':'energetica', 'Espiritual':'espiritual', 'Mando':'mando', 'Psíquica':'psiquica', 'Oscura':'oscura' };
    const mayorAf = getMayorAfinidad(p);
    const mKey = afiMap[mayorAf] || 'fisica';
    const calcAfT = (k) => (p.afinidadesBase[k]||0)+(p.hechizos[k]||0)+(p.hechizosEfecto[k]||0)+(p.buffs[k]||0);
    const valMayorAf = calcAfT(mKey);
    
    let html = `
    <div style="display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #d4af37; padding-bottom: 20px; opacity:${p.isActive ? '1' : '0.5'}; flex-wrap:wrap;">
        <img src="../img/imgpersonajes/${iconoGrande}icon.png" style="width: 120px; height: 120px; border-radius: 50%; border: 3px solid #d4af37; object-fit: cover;" onerror="${imgError}">
        <div style="text-align:left; flex:1;">
            <h1 style="margin: 0;">${nombre.toUpperCase()} ${p.isNPC ? '<span style="font-size:0.4em; color:#aaa">[NPC]</span>' : ''} ${!p.isActive ? '<span style="font-size:0.4em; color:#ff0000">[INACTIVO]</span>' : ''}</h1>
            ${asisUI}
            <div class="status-container">${estadosHTML}</div>
            <div style="background:#111; border:1px solid var(--gold-dim); padding:10px; border-radius:4px; margin-top:15px; display:flex; justify-content:space-around; flex-wrap:wrap; gap:10px;">
               <span>🎒 OBJETOS: <b style="color:var(--gold)">${countObj}</b></span>
               <span>📖 HECHIZOS: <b style="color:var(--cyan-magic)">${mySpells.length}</b></span>
               <span>✨ AFIN. PRIMARIA: <b style="color:var(--gold)">${mayorAf} (${valMayorAf})</b></span>
            </div>
        </div>
        ${estadoUI.esAdmin ? `<button onclick="window.abrirModalOP()" style="background:#4a004a; border-color:#ff00ff; padding:15px; font-size:1.1em; color:white; box-shadow:0 0 15px rgba(255,0,255,0.3);">⚙️ EDITAR FICHA MÁSTER</button>` : ''}
    </div>

    <div class="circle-wrap">
        <div class="stat-circle hex-circle copy-wrap" onclick="window.copySilently('HEX: ${p.hex}', event)" style="background: conic-gradient(var(--gold-dark) 0%, var(--gold-light) ${hexPercent / 2}%, var(--gold-dark) ${hexPercent}%, #111 ${hexPercent}%); box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);">
            <div class="inner"><strong>${p.hex}</strong><span>HEX</span></div>
        </div>
        <div class="stat-circle vex-circle copy-wrap" onclick="window.copySilently('VEX: ${vexVisual}', event)" style="background: conic-gradient(var(--blue-life-dark) 0%, var(--blue-life-light) ${vexPercent / 2}%, var(--blue-life-dark) ${vexPercent}%, #111 ${vexPercent}%); box-shadow: 0 0 15px rgba(74, 144, 226, 0.3);">
            <div class="inner"><strong>${vexVisual}</strong><span>VEX</span></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div>
            <h3 style="margin-top:0;">Vitalidad</h3>
            <div class="health-box copy-wrap" style="display:block; width:100%; box-sizing:border-box;" onclick="window.copySilently('Vida Roja: ${p.vidaRojaActual}/${vidas.maxRojo}', event)"><label style="color:var(--red-life);">VIDA ROJA (${p.vidaRojaActual}/${vidas.maxRojo})</label><div class="health-grid">${vidas.rojasHTML}</div></div>
            <div class="health-box copy-wrap" style="display:block; width:100%; box-sizing:border-box;" onclick="window.copySilently('Vida Azul: ${vidas.azulTotal}', event)"><label style="color:var(--blue-life);">VIDA AZUL (${vidas.azulTotal})</label><div class="health-grid">${vidas.azulesHTML}</div></div>
            <div class="health-box copy-wrap" style="display:block; width:100%; box-sizing:border-box;" onclick="window.copySilently('Guardas: ${vidas.guardaTotal}', event)"><label style="color:var(--gold);">GUARDA DORADA (${vidas.guardaTotal})</label><div class="health-grid">${vidas.guardasHTML}</div></div>
            
            <h3 style="margin-top:20px;">Ofensiva Totales</h3>
            <div class="affinities-grid">
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Daño Rojo: ${calcTotal(p.baseDanoRojo, p.hechizos.danoRojo, p.hechizosEfecto.danoRojo, p.buffs.danoRojo)}', event)"><label style="color:var(--red-life)">Daño Rojo</label><span style="font-size:1.4em;">${calcTotal(p.baseDanoRojo, p.hechizos.danoRojo, p.hechizosEfecto.danoRojo, p.buffs.danoRojo)}</span>${bTextSplit(p.hechizos.danoRojo, p.hechizosEfecto.danoRojo, p.buffs.danoRojo)}</div>
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Daño Azul: ${calcTotal(p.baseDanoAzul, p.hechizos.danoAzul, p.hechizosEfecto.danoAzul, p.buffs.danoAzul)}', event)"><label style="color:var(--blue-life)">Daño Azul</label><span style="font-size:1.4em;">${calcTotal(p.baseDanoAzul, p.hechizos.danoAzul, p.hechizosEfecto.danoAzul, p.buffs.danoAzul)}</span>${bTextSplit(p.hechizos.danoAzul, p.hechizosEfecto.danoAzul, p.buffs.danoAzul)}</div>
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Elim. Dorada: ${calcTotal(p.baseElimDorada, p.hechizos.elimDorada, p.hechizosEfecto.elimDorada, p.buffs.elimDorada)}', event)"><label style="color:var(--gold)">Elim. Dorada</label><span style="font-size:1.4em;">${calcTotal(p.baseElimDorada, p.hechizos.elimDorada, p.hechizosEfecto.elimDorada, p.buffs.elimDorada)}</span>${bTextSplit(p.hechizos.elimDorada, p.hechizosEfecto.elimDorada, p.buffs.elimDorada)}</div>
            </div>
        </div>
        <div>
            <h3 style="margin-top:0; color:#ddd; text-align:left;">Afinidades Totales</h3>
            <div class="affinities-grid">
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Física: ${calcTotal(p.afinidadesBase.fisica, p.hechizos.fisica, p.hechizosEfecto.fisica, p.buffs.fisica)}', event)"><label>Física</label><span style="font-size:1.4em;">${calcTotal(p.afinidadesBase.fisica, p.hechizos.fisica, p.hechizosEfecto.fisica, p.buffs.fisica)}</span>${bTextSplit(p.hechizos.fisica, p.hechizosEfecto.fisica, p.buffs.fisica)}</div>
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Energética: ${calcTotal(p.afinidadesBase.energetica, p.hechizos.energetica, p.hechizosEfecto.energetica, p.buffs.energetica)}', event)"><label>Energética</label><span style="font-size:1.4em;">${calcTotal(p.afinidadesBase.energetica, p.hechizos.energetica, p.hechizosEfecto.energetica, p.buffs.energetica)}</span>${bTextSplit(p.hechizos.energetica, p.hechizosEfecto.energetica, p.buffs.energetica)}</div>
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Espiritual: ${calcTotal(p.afinidadesBase.espiritual, p.hechizos.espiritual, p.hechizosEfecto.espiritual, p.buffs.espiritual)}', event)"><label>Espiritual</label><span style="font-size:1.4em;">${calcTotal(p.afinidadesBase.espiritual, p.hechizos.espiritual, p.hechizosEfecto.espiritual, p.buffs.espiritual)}</span>${bTextSplit(p.hechizos.espiritual, p.hechizosEfecto.espiritual, p.buffs.espiritual)}</div>
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Mando: ${calcTotal(p.afinidadesBase.mando, p.hechizos.mando, p.hechizosEfecto.mando, p.buffs.mando)}', event)"><label>Mando</label><span style="font-size:1.4em;">${calcTotal(p.afinidadesBase.mando, p.hechizos.mando, p.hechizosEfecto.mando, p.buffs.mando)}</span>${bTextSplit(p.hechizos.mando, p.hechizosEfecto.mando, p.buffs.mando)}</div>
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Psíquica: ${calcTotal(p.afinidadesBase.psiquica, p.hechizos.psiquica, p.hechizosEfecto.psiquica, p.buffs.psiquica)}', event)"><label>Psíquica</label><span style="font-size:1.4em;">${calcTotal(p.afinidadesBase.psiquica, p.hechizos.psiquica, p.hechizosEfecto.psiquica, p.buffs.psiquica)}</span>${bTextSplit(p.hechizos.psiquica, p.hechizosEfecto.psiquica, p.buffs.psiquica)}</div>
                <div class="affinity-box copy-wrap" onclick="window.copySilently('Oscura: ${calcTotal(p.afinidadesBase.oscura, p.hechizos.oscura, p.hechizosEfecto.oscura, p.buffs.oscura)}', event)"><label>Oscura</label><span style="font-size:1.4em;">${calcTotal(p.afinidadesBase.oscura, p.hechizos.oscura, p.hechizosEfecto.oscura, p.buffs.oscura)}</span>${bTextSplit(p.hechizos.oscura, p.hechizosEfecto.oscura, p.buffs.oscura)}</div>
                <div class="copy-wrap" onclick="window.copySilently('Suma Total Afinidades: ${['fisica','energetica','espiritual','mando','psiquica','oscura'].reduce((a,k)=>a+calcTotal(p.afinidadesBase[k],p.hechizos[k],p.hechizosEfecto[k],p.buffs[k]),0)}', event)" style="grid-column: 1 / -1; text-align:center; color:#aaa; font-size:0.75em; margin-top:5px; font-weight:bold; padding-top:5px; border-top:1px dashed #333; display:block;">Suma Total Afinidades: ${['fisica','energetica','espiritual','mando','psiquica','oscura'].reduce((a,k)=>a+calcTotal(p.afinidadesBase[k],p.hechizos[k],p.hechizosEfecto[k],p.buffs[k]),0)}</div>
            </div>
        </div>
    </div>`;

    // GRID DE HECHIZOS
    html += `
    <h3 style="margin-top:30px; color:#4a90e2; border-bottom:1px solid #4a90e2; padding-bottom:5px;">Grimorio (Hechizos Aprendidos) <span style="font-size:0.7em; color:#aaa;">- Clic para copiar</span></h3>
    <div class="spell-grid-4">
        ${mySpells.map(s => `<button type="button" class="spell-button" onclick="window.copySilently('${s.Hechizo.replace(/'/g, "\\'")}', event)">${s.Hechizo}</button>`).join('') || '<div style="grid-column:1/-1; text-align:center; color:#aaa; padding:10px;">No posee hechizos registrados.</div>'}
    </div>`;

    contenedor.innerHTML = html;
}

// PANEL OP COMO UN MODAL POP-UP
export function dibujarPanelEdicionOP() {
    const nombre = estadoUI.personajeSeleccionado; const p = statsGlobal[nombre];
    if(!p) return ``;
    
    const pVidaDanoBase = [ { id: 'baseVidaAzul', label: 'C. Azules (BASE)', val: p.baseVidaAzul }, { id: 'baseGuardaDorada', label: 'G. Dorada (BASE)', val: p.baseGuardaDorada }, { id: 'danoRojo', label: 'Daño Rojo (BASE)', val: p.baseDanoRojo }, { id: 'danoAzul', label: 'Daño Azul (BASE)', val: p.baseDanoAzul }, { id: 'elimDorada', label: 'Elim. Dorada (BASE)', val: p.baseElimDorada } ];
    const pAfinidadesBase = [ { id: 'fisica', label: 'Física (BASE)', val: p.afinidadesBase.fisica }, { id: 'energetica', label: 'Energética (BASE)', val: p.afinidadesBase.energetica }, { id: 'espiritual', label: 'Espiritual (BASE)', val: p.afinidadesBase.espiritual }, { id: 'mando', label: 'Mando (BASE)', val: p.afinidadesBase.mando }, { id: 'psiquica', label: 'Psíquica (BASE)', val: p.afinidadesBase.psiquica }, { id: 'oscura', label: 'Oscura (BASE)', val: p.afinidadesBase.oscura } ];

    const pAfinidadesSpellEff = [ { id: 'fisica', label: 'Física (ALT)', val: p.hechizosEfecto.fisica }, { id: 'energetica', label: 'Energética (ALT)', val: p.hechizosEfecto.energetica }, { id: 'espiritual', label: 'Espiritual (ALT)', val: p.hechizosEfecto.espiritual }, { id: 'mando', label: 'Mando (ALT)', val: p.hechizosEfecto.mando }, { id: 'psiquica', label: 'Psíquica (ALT)', val: p.hechizosEfecto.psiquica }, { id: 'oscura', label: 'Oscura (ALT)', val: p.hechizosEfecto.oscura }, { id: 'danoRojo', label: 'Daño Rojo (ALT)', val: p.hechizosEfecto.danoRojo }, { id: 'danoAzul', label: 'Daño Azul (ALT)', val: p.hechizosEfecto.danoAzul }, { id: 'elimDorada', label: 'Elim. Dorada (ALT)', val: p.hechizosEfecto.elimDorada } ];

    let html = `
        <h2 style="color:var(--gold); margin-top:0; text-align:center;">🛠️ PANEL DE EDICIÓN MÁSTER: ${nombre.toUpperCase()}</h2>
        <div style="display:flex; justify-content:center; gap:20px; margin-bottom:20px;">
            <button type="button" onclick="window.toggleIdentidad('isPlayer')" style="width:150px; background:${p.isPlayer ? '#004a00' : '#4a0000'}; border-color:${p.isPlayer ? '#00ff00' : '#ff0000'}; color:white;">${p.isPlayer ? 'ROL: JUGADOR' : 'ROL: NPC'}</button>
            <button type="button" onclick="window.toggleIdentidad('isActive')" style="width:150px; background:${p.isActive ? '#004a00' : '#4a0000'}; border-color:${p.isActive ? '#00ff00' : '#ff0000'}; color:white;">${p.isActive ? 'ESTADO: ACTIVO' : 'ESTADO: INACTIVO'}</button>
        </div>
        
        <h3 style="color:#fff; border-bottom:1px dashed var(--gold); padding-bottom:5px; text-align:left;">1. Acciones Rápidas (Vida y Energía)</h3>
        <div class="edit-grid-3">
            <div class="edit-card">
                <h4>Ganancia HEX</h4>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modHexInd('${nombre}', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modHexInd('${nombre}', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modHexInd('${nombre}', 10)">+10</button><button type="button" class="btn-minus" onclick="window.modHexInd('${nombre}', -10)">-10</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#004a4a;" onclick="window.modHexInd('${nombre}', 50)">+50</button><button type="button" class="btn-minus" style="background:#4a0000;" onclick="window.modHexInd('${nombre}', -50)">-50</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#004a00;" onclick="window.modHexInd('${nombre}', 100)">+100</button><button type="button" class="btn-minus" style="background:#4a0000;" onclick="window.modHexInd('${nombre}', -100)">-100</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#4a004a;" onclick="window.modHexInd('${nombre}', 500)">+500</button><button type="button" class="btn-minus" style="background:#4a0040;" onclick="window.modHexInd('${nombre}', -500)">-500</button></div>
            </div>
            <div class="edit-card">
                <h4>Vida Roja (Actual)</h4>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 1)">+1 (Cura)</button><button type="button" class="btn-minus" onclick="window.modLibre('vidaRojaActual', -1)">-1 (Daño)</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 5)">+5 (Cura)</button><button type="button" class="btn-minus" onclick="window.modLibre('vidaRojaActual', -5)">-5 (Daño)</button></div>
            </div>
            <div class="edit-card" style="background:#1a1a00; border-color:#b8860b;">
                <h4 style="color:#b8860b;">Restauración Teórica Óptima</h4>
                <button type="button" onclick="window.recalcularBases()" style="background:#b8860b; color:#000; font-weight:bold; width:100%; padding:15px; font-size:1em; border-radius:4px; transition:0.2s; margin-top:10px;">RECALCULAR CORAZONES</button>
                <p style="font-size:0.7em; color:#aaa; margin-top:5px; text-transform:none;">Esto ajustará el Límite Rojo a [10 + Física/2], la Vida Azul a [Magia/4] y curará al personaje.</p>
            </div>
        </div>

        <h3 style="color:#fff; border-bottom:1px dashed #ff4444; padding-bottom:5px; text-align:left; margin-top:20px;">2. Límites de Vitalidad y Defensa</h3>
        <div class="edit-grid-3">
            <div class="edit-card">
                <h4>Límite Rojo (BASE)</h4>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modBaseTop('vidaRojaMax', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modBaseTop('vidaRojaMax', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" onclick="window.modBaseTop('vidaRojaMax', 5)">+5</button><button type="button" class="btn-minus5" onclick="window.modBaseTop('vidaRojaMax', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>C. Azules (BASE)</h4>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modBaseTop('vidaAzul', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modBaseTop('vidaAzul', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" onclick="window.modBaseTop('vidaAzul', 5)">+5</button><button type="button" class="btn-minus5" onclick="window.modBaseTop('vidaAzul', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>Guarda Dorada (BASE)</h4>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modBaseTop('guardaDorada', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modBaseTop('guardaDorada', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" onclick="window.modBaseTop('guardaDorada', 5)">+5</button><button type="button" class="btn-minus5" onclick="window.modBaseTop('guardaDorada', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>Límite Rojo <span style="color:#00ff00">(EXT)</span></h4>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#330066;" onclick="window.modificarBuff('vidaRojaMaxExtra', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modificarBuff('vidaRojaMaxExtra', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" style="background:#004a4a;" onclick="window.modificarBuff('vidaRojaMaxExtra', 5)">+5</button><button type="button" class="btn-minus5" onclick="window.modificarBuff('vidaRojaMaxExtra', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>C. Azules <span style="color:#00ff00">(EXT)</span></h4>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#330066;" onclick="window.modificarBuff('vidaAzulExtra', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modificarBuff('vidaAzulExtra', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" style="background:#004a4a;" onclick="window.modificarBuff('vidaAzulExtra', 5)">+5</button><button type="button" class="btn-minus5" onclick="window.modificarBuff('vidaAzulExtra', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>G. Dorada <span style="color:#00ff00">(EXT)</span></h4>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#330066;" onclick="window.modificarBuff('guardaDoradaExtra', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modificarBuff('guardaDoradaExtra', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" style="background:#004a4a;" onclick="window.modificarBuff('guardaDoradaExtra', 5)">+5</button><button type="button" class="btn-minus5" onclick="window.modificarBuff('guardaDoradaExtra', -5)">-5</button></div>
            </div>
        </div>

        <h3 style="color:#fff; border-bottom:1px dashed var(--gold); padding-bottom:5px; text-align:left; margin-top:30px;">3. Afinidades y Atributos BASE (Permanentes)</h3>
        <div class="edit-grid-3">
            ${[ { id: 'fisica', label: 'Física Base', val: p.afinidadesBase.fisica }, { id: 'energetica', label: 'Energética Base', val: p.afinidadesBase.energetica }, { id: 'espiritual', label: 'Espiritual Base', val: p.afinidadesBase.espiritual }, { id: 'mando', label: 'Mando Base', val: p.afinidadesBase.mando }, { id: 'psiquica', label: 'Psíquica Base', val: p.afinidadesBase.psiquica }, { id: 'oscura', label: 'Oscura Base', val: p.afinidadesBase.oscura }, { id: 'danoRojo', label: 'Daño Rojo Base', val: p.baseDanoRojo }, { id: 'danoAzul', label: 'Daño Azul Base', val: p.baseDanoAzul }, { id: 'elimDorada', label: 'Elim. Dorada Base', val: p.baseElimDorada } ].map(f => genCard(f, 'baseAfin')).join('')}
        </div>

        <h3 style="color:#fff; border-bottom:1px dashed #4a90e2; padding-bottom:5px; text-align:left; margin-top:30px;">4. Alteración por Efectos de Hechizos (Habilidades)</h3>
        <div class="edit-grid-3">
            ${[ { id: 'fisica', label: 'Física (Alteración)', val: p.hechizosEfecto.fisica }, { id: 'energetica', label: 'Energética (Alteración)', val: p.hechizosEfecto.energetica }, { id: 'espiritual', label: 'Espiritual (Alteración)', val: p.hechizosEfecto.espiritual }, { id: 'mando', label: 'Mando (Alteración)', val: p.hechizosEfecto.mando }, { id: 'psiquica', label: 'Psíquica (Alteración)', val: p.hechizosEfecto.psiquica }, { id: 'oscura', label: 'Oscura (Alteración)', val: p.hechizosEfecto.oscura }, { id: 'danoRojo', label: 'Daño Rojo (Alteración)', val: p.hechizosEfecto.danoRojo }, { id: 'danoAzul', label: 'Daño Azul (Alteración)', val: p.hechizosEfecto.danoAzul }, { id: 'elimDorada', label: 'Elim. Dorada (Alteración)', val: p.hechizosEfecto.elimDorada } ].map(f => genCard(f, 'spellEffAfin')).join('')}
        </div>

        <h3 style="color:#fff; border-bottom:1px dashed #00ff00; padding-bottom:5px; text-align:left; margin-top:30px;">5. Extras Temporales (Buffs/Objetos)</h3>
        <div class="edit-grid-3">
            ${[ { id: 'fisica', label: 'Afin. Física (Extra)', val: p.buffs.fisica }, { id: 'energetica', label: 'Afin. Energética (Extra)', val: p.buffs.energetica }, { id: 'espiritual', label: 'Afin. Espiritual (Extra)', val: p.buffs.espiritual }, { id: 'mando', label: 'Afin. Mando (Extra)', val: p.buffs.mando }, { id: 'psiquica', label: 'Afin. Psíquica (Extra)', val: p.buffs.psiquica }, { id: 'oscura', label: 'Afin. Oscura (Extra)', val: p.buffs.oscura }, { id: 'danoRojo', label: 'Daño Rojo (Extra)', val: p.buffs.danoRojo }, { id: 'danoAzul', label: 'Daño Azul (Extra)', val: p.buffs.danoAzul }, { id: 'elimDorada', label: 'Elim. Dorada (Extra)', val: p.buffs.elimDorada } ].map(f => genCard(f, 'buff')).join('')}
        </div>

        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top:30px;">6. Efectos de Estado</h3>
        <div class="edit-grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); margin-bottom:20px;">`;
        listaEstados.forEach(e => {
            let val = p.estados[e.id];
            if (e.tipo === 'numero') { html += `<div class="edit-card"><h4>${e.nombre}</h4><span style="color:${e.border}; font-size:1.5em; font-weight:bold;">${val}</span><div class="btn-row"><button type="button" class="btn-plus" onclick="window.modEstado('${e.id}', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modEstado('${e.id}', -1)">-1</button></div></div>`; } 
            else { let extraStyle = val ? `background:${e.bg}; color:${e.id==='huesos'?'#000':'#fff'}; border-color:${e.border};` : ''; html += `<button type="button" class="status-toggle ${val ? 'active' : ''}" style="${extraStyle}" onclick="window.toggleEstado('${e.id}')">${e.nombre}</button>`; }
        });
html += `</div>
        
        <div style="margin-top:20px; background:#1a0033; border:1px dashed #d4af37; padding:15px; border-radius:8px; text-align:center;">
            <h3 style="margin-top:0; color:var(--gold);">🛠️ Clonación e Importación</h3>
            <div style="display:flex; justify-content:center; align-items:center; gap:10px; flex-wrap:wrap;">
                <select id="clon-source" style="padding:10px; background:#000; color:white; border:1px solid var(--gold); font-family:'Cinzel'; min-width:200px;"><option value="" disabled selected>-- Selecciona Origen --</option>${Object.keys(statsGlobal).filter(n => n !== nombre).map(n => `<option value="${n}">${n}</option>`).join('')}</select>
                <button type="button" onclick="window.ejecutarClonacion('estados')" style="background:#004a4a; border:1px solid #00ffff; padding:10px 15px; color:white; font-weight:bold; transition:0.2s;">Importar Estados</button>
                <button type="button" onclick="window.ejecutarClonacion('efectosExtras')" style="background:#4a90e2; border:1px solid #00ffff; padding:10px 15px; color:#111; font-weight:bold; transition:0.2s;">Copiar Efectos y Extras</button>
                <button type="button" onclick="window.ejecutarClonacion('hex')" style="background:#b8860b; border:1px solid #ffd700; padding:10px 15px; color:#000; font-weight:bold; transition:0.2s;">Copiar HEX</button>
                <button type="button" onclick="window.ejecutarClonacion('completo')" style="background:#4a004a; border:1px solid #8a008a; padding:10px 15px; color:white; font-weight:bold; transition:0.2s;">Clonar Todo</button>
            </div>
        </div>`;
    return html;
}

export function dibujarMenuOP() {
    return `
        <h3>PANEL GENERAL MÁSTER</h3>
        <p style="color:#aaa; font-size:0.8em; margin-top:-10px; margin-bottom:20px;">Utiliza los botones rápidos o selecciona un personaje del catálogo para editar su ficha base.</p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;">
            <button type="button" onclick="window.mostrarPaginaOP('hex')" style="background:#b8860b; color:#000; font-weight:bold;">Gestión de HEX y Party</button>
            <button type="button" onclick="window.mostrarPaginaOP('crear')" style="background:#004a4a; color:white; font-weight:bold;">Forjar Nuevo NPC (Manual)</button>
            <button type="button" onclick="window.descargarAumentada()">📥 Descargar CSV Aumentado</button>
        </div>
        <div id="sub-vista-op"></div>
    `;
}

export function dibujarHexOP() {
    let html = `<div style="text-align:center; max-width:1200px; margin:0 auto;">
        <h2 style="color:var(--gold); margin-top:0;">Gestión de HEX y Party (MÁSTER)</h2>
        
        <div style="background:#1a0033; padding:15px; border-radius:8px; border:1px solid var(--gold); margin-bottom:20px;">
            <h3 style="color:var(--gold); margin-top:0;">Party Activa (Máx 6 Slots)</h3>
            <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:15px;">`;
    
    for(let i=0; i<6; i++) {
        const char = estadoUI.party[i];
        if(char && statsGlobal[char]) {
            const icono = normalizar(statsGlobal[char]?.iconoOverride || char);
            html += `<div style="width:80px; height:80px; border:2px solid var(--gold); border-radius:8px; background:url('../img/imgpersonajes/${icono}icon.png') center/cover; position:relative;" title="${char}">
                <button onclick="window.togglePartyMember('${char}', false)" style="position:absolute; top:-8px; right:-8px; background:#ff0000; color:white; border-radius:50%; width:24px; height:24px; font-size:14px; font-weight:bold; border:2px solid #fff; cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center;">X</button>
                <div style="position:absolute; bottom:0; background:rgba(0,0,0,0.7); width:100%; font-size:0.6em; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:2px 0; border-radius:0 0 8px 8px;">${char}</div>
            </div>`;
        } else {
            html += `<div style="width:80px; height:80px; border:2px dashed #666; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:2em; color:#666; background:#111;">${i+1}</div>`;
        }
    }
    
    html += `</div>
            
            <div style="margin: 15px auto; max-width: 800px; background: #0a0014; border: 1px solid #00ffff; border-radius: 8px; padding: 15px; text-align: left;">
                <h4 style="margin: 0 0 10px 0; color: #00ffff; text-align: center;">Seleccionar Jugadores de la Lista</h4>
                <div style="max-height: 180px; overflow-y: auto; padding-right: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;">`;
    
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        if (p.isPlayer) {
            const isChecked = estadoUI.party.includes(nombre) ? 'checked' : '';
            const iconoMuestra = normalizar(p.iconoOverride || nombre);
            html += `
                <label style="display:flex; align-items:center; gap:8px; background:#111; padding:8px; border-radius:4px; border:1px solid #333; cursor:pointer; transition:0.2s; user-select:none;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='#333'">
                    <input type="checkbox" ${isChecked} onchange="window.togglePartyMember('${nombre}', this.checked)" style="transform:scale(1.3); cursor:pointer;">
                    <img src="../img/imgpersonajes/${iconoMuestra}icon.png" style="width:30px; height:30px; border-radius:50%; border:1px solid #fff; object-fit:cover;" onerror="${imgError}">
                    <span style="color:white; font-size:0.85em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:bold; flex:1;">${nombre}</span>
                </label>
            `;
        }
    });

    html += `   </div>
            </div>
            <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:20px;">
                <button type="button" onclick="window.establecerPartyActiva()" style="background:#004a00; border-color:#00ff00; color:white; font-weight:bold;">ESTABLECER COMO ACTIVOS</button>
                <button type="button" onclick="window.vaciarParty()" style="background:#4a0040; border-color:#ff00ff; color:white;">VACIAR SLOTS</button>
                <button type="button" onclick="window.addAsistenciaGlobal()" style="background:#4a004a; border-color:#8a008a; color:white; font-weight:bold;">SUMAR ASISTENCIA (+1) A PARTY</button>
            </div>
        </div>
        
        <div style="background:#0a0014; padding:15px; border-radius:8px; border:1px solid var(--blue-life); margin-bottom:20px;">
            <h3 style="color:var(--blue-life); margin-top:0;">Dar HEX Global (A los 6 Slots)</h3>
            <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
                <button type="button" onclick="window.modHexGlobal(10)" class="btn-plus">+10</button>
                <button type="button" onclick="window.modHexGlobal(-10)" class="btn-minus">-10</button>
                <button type="button" onclick="window.modHexGlobal(30)" class="btn-plus">+30</button>
                <button type="button" onclick="window.modHexGlobal(-30)" class="btn-minus">-30</button>
                <button type="button" onclick="window.modHexGlobal(300)" class="btn-plus" style="background:#4a004a;">+300</button>
                <button type="button" onclick="window.modHexGlobal(-300)" class="btn-minus" style="background:#4a0000;">-300</button>
                <button type="button" onclick="window.modHexGlobal(500)" class="btn-plus" style="background:#4a004a;">+500</button>
                <button type="button" onclick="window.modHexGlobal(-500)" class="btn-minus" style="background:#4a0000;">-500</button>
                <button type="button" onclick="window.modHexGlobal(1000)" class="btn-plus" style="background:#4a004a;">+1000</button>
                <button type="button" onclick="window.modHexGlobal(-1000)" class="btn-minus" style="background:#4a0000;">-1000</button>
            </div>
        </div>

        <div class="edit-grid">`;

    estadoUI.party.forEach(nombre => {
        if (nombre && statsGlobal[nombre]) {
            const p = statsGlobal[nombre];
            const asisTexto = p.isPlayer ? `(${p.asistencia || 1}/7)` : `(NPC)`;
            const iconoMuestra = normalizar(p.iconoOverride || nombre);
            html += `
            <div class="edit-card" style="border-color:var(--gold);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                    <img src="../img/imgpersonajes/${iconoMuestra}icon.png" style="width:50px; height:50px; border-radius:50%; border:1px solid var(--gold); object-fit:cover;" onerror="${imgError}">
                    <div style="text-align:left;">
                        <h4 style="margin:0; font-size:1em;">${nombre}</h4>
                        <div style="color:var(--gold); font-size:0.9em; font-weight:bold;">HEX: ${p.hex} <span style="color:#aaa; font-size:0.8em;">${asisTexto}</span></div>
                    </div>
                </div>
                <div class="btn-row"><button type="button" onclick="window.modHexInd('${nombre}', 1)" class="btn-plus">+1</button><button type="button" onclick="window.modHexInd('${nombre}', -1)" class="btn-minus">-1</button></div>
                <div class="btn-row"><button type="button" onclick="window.modHexInd('${nombre}', 5)" class="btn-plus">+5</button><button type="button" onclick="window.modHexInd('${nombre}', -5)" class="btn-minus">-5</button></div>
                <div class="btn-row"><button type="button" onclick="window.modHexInd('${nombre}', 10)" class="btn-plus">+10</button><button type="button" onclick="window.modHexInd('${nombre}', -10)" class="btn-minus">-10</button></div>
                <div class="btn-row"><button type="button" onclick="window.modHexInd('${nombre}', 50)" style="background:#004a4a;" class="btn-plus">+50</button><button type="button" onclick="window.modHexInd('${nombre}', -50)" style="background:#4a0000;" class="btn-minus">-50</button></div>
                <div class="btn-row"><button type="button" onclick="window.modHexInd('${nombre}', 100)" style="background:#004a4a;" class="btn-plus">+100</button><button type="button" onclick="window.modHexInd('${nombre}', -100)" style="background:#4a0000;" class="btn-minus">-100</button></div>
                <div class="btn-row"><button type="button" onclick="window.modHexInd('${nombre}', 300)" style="background:#4a004a;" class="btn-plus">+300</button><button type="button" onclick="window.modHexInd('${nombre}', -300)" style="background:#4a0000;" class="btn-minus">-300</button></div>
                <div class="btn-row"><button type="button" onclick="window.modHexInd('${nombre}', 500)" style="background:#4a004a;" class="btn-plus">+500</button><button type="button" onclick="window.modHexInd('${nombre}', -500)" style="background:#4a0000;" class="btn-minus">-500</button></div>
                <div class="btn-row"><button type="button" onclick="window.modHexInd('${nombre}', 1000)" style="background:#4a004a;" class="btn-plus">+1000</button><button type="button" onclick="window.modHexInd('${nombre}', -1000)" style="background:#4a0000;" class="btn-minus">-1000</button></div>
            </div>`;
        }
    });

    html += `</div>
        <div style="margin-top:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37; border-radius:8px;">
            <h3 style="margin-top:0; color:var(--gold);">Registro de HEX Unificado (Portapapeles)</h3>
            <textarea id="hex-log-textarea" readonly style="width:95%; height:150px; background:#000; color:#fff; border:1px solid var(--gold); padding:10px; font-family:monospace; margin-bottom:10px;"></textarea>
            <div style="display:flex; gap:10px;">
                <button type="button" onclick="window.copiarHexLog()" style="flex:3; background:var(--gold); color:black; font-weight:bold;">📄 COPIAR LOG</button>
                <button type="button" onclick="window.limpiarHexLog()" style="flex:1; background:#4a0000; color:white;">🗑️ LIMPIAR</button>
            </div>
        </div>
    </div>`;
    return html;
}

function genCard(f, tipoAccion) {
    let btns = ''; let clickMod = '';
    if (tipoAccion === 'buff') clickMod = 'window.modificarBuff'; 
    else if (tipoAccion === 'baseTop') clickMod = 'window.modBaseTop'; 
    else if (tipoAccion === 'baseAfin') clickMod = 'window.modBaseAfin'; 
    else if (tipoAccion === 'spellEffTop') clickMod = 'window.modSpellEffTop'; 
    else if (tipoAccion === 'spellEffAfin') clickMod = 'window.modSpellEffAfin'; 
    else if (tipoAccion === 'form') clickMod = 'window.modForm';

    const visualVal = f.val !== undefined ? f.val : 0;
    const inputId = tipoAccion === 'form' ? f.id : `inp-${tipoAccion}-${f.id}`;
    const attrInput = tipoAccion === 'form' ? `oninput="window.updateCreationAfinitySum()"` : `onchange="window.cambioManual('${f.id}', this.value, '${tipoAccion}')"`;
    const paramId = tipoAccion === 'form' ? inputId : f.id;
    
    let inputHtml = `<input type="number" id="${inputId}" value="${visualVal}" ${attrInput} style="width:80%; text-align:center; background:#000; color:white; border:1px dashed var(--gold); margin-bottom:10px; font-size:1.5em; padding:5px; box-sizing:border-box;">`;

    btns = `<div class="btn-row"><button type="button" class="btn-plus" onclick="${clickMod}('${paramId}', 1)">+1</button><button type="button" class="btn-minus" onclick="${clickMod}('${paramId}', -1)">-1</button></div><div class="btn-row"><button type="button" class="btn-plus5" onclick="${clickMod}('${paramId}', 5)">+5</button><button type="button" class="btn-minus5" onclick="${clickMod}('${paramId}', -5)">-5</button></div><div class="btn-row"><button type="button" class="btn-plus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${paramId}', 10)">+10</button><button type="button" class="btn-minus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${paramId}', -10)">-10</button></div>`;
    
    return `<div class="edit-card"><h4>${f.label}</h4>${inputHtml}${btns}</div>`;
}

export function dibujarFormularioCrear() {
    const pEnergia = [ { id:'npc-hex', label:'HEX Inicial', val:0, esHex:true }, { id:'npc-vex', label:'VEX Inicial', val:0, esHex:true } ];
    const pVidaDano = [ { id:'npc-vra', label:'Corazones Actuales', val:10 }, { id:'npc-vrm', label:'Corazones (Límite Máx)', val:10 }, { id:'npc-va', label:'Corazones Azules', val:0 }, { id:'npc-gd', label:'Guarda Dorada', val:0 }, { id:'npc-dr', label:'Daño Rojo', val:1 }, { id:'npc-da', label:'Daño Azul', val:0 }, { id:'npc-ed', label:'Elim. Dorada', val:0 } ];
    const pAfinidades = [ { id:'npc-fis', label:'Física' }, { id:'npc-ene', label:'Energética' }, { id:'npc-esp', label:'Espiritual' }, { id:'npc-man', label:'Mando' }, { id:'npc-psi', label:'Psíquica' }, { id:'npc-osc', label:'Oscura' } ];
    
    let afinGridHtml = '';
    pAfinidades.forEach(f => {
        afinGridHtml += `
        <div class="edit-card">
            <h4>Afin. ${f.label}</h4>
            <input type="number" id="${f.id}" value="0" oninput="window.updateCreationAfinitySum()" style="width:80%; text-align:center; background:#000; color:white; border:1px dashed var(--gold); margin-bottom:10px; font-size:1.5em; padding:5px; box-sizing:border-box;">
            <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modForm('${f.id}', 1); window.updateCreationAfinitySum();">+1</button><button type="button" class="btn-minus" onclick="window.modForm('${f.id}', -1); window.updateCreationAfinitySum();">-1</button></div>
            <div class="btn-row"><button type="button" class="btn-plus5" onclick="window.modForm('${f.id}', 5); window.updateCreationAfinitySum();">+5</button><button type="button" class="btn-minus5" onclick="window.modForm('${f.id}', -5); window.updateCreationAfinitySum();">-5</button></div>
        </div>`;
    });

    return `
    <div style="text-align:center; max-width:1000px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Forja de Personaje MÁSTER</h3>
        <input type="text" id="npc-nombre" placeholder="Nombre del Personaje..." style="width:100%; max-width:400px; margin-bottom:20px; padding:10px; background:#000; color:var(--gold); border:1px solid var(--gold); font-size:1.2em; text-align:center;">
        
        <div style="background:#1a0033; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid var(--gold); max-width:600px; margin-left:auto; margin-right:auto;">
            <h3 style="color:var(--gold); margin-top:0;">Identidad Inicial</h3>
            <div style="display:flex; justify-content:center; gap:20px;">
                <button type="button" id="btn-crear-rol" onclick="window.toggleCrearRol()" data-val="npc" style="width:150px; background:#4a0000; border-color:#ff0000; color:white;">ROL: NPC</button>
                <button type="button" id="btn-crear-act" onclick="window.toggleCrearAct()" data-val="activo" style="width:150px; background:#004a00; border-color:#00ff00; color:white;">ESTADO: ACTIVO</button>
            </div>
        </div>

        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">1. Energía Base</h3><div class="edit-grid" style="margin-bottom: 20px;">${pEnergia.map(f => genCard(f, 'form')).join('')}</div>
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">2. Vitalidad y Ofensiva Base</h3><div class="edit-grid" style="margin-bottom: 20px;">${pVidaDano.map(f => genCard(f, 'form')).join('')}</div>
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">3. Afinidades Base</h3>
        <div class="edit-grid" style="margin-bottom: 20px;">${afinGridHtml}</div>
        <div id="creation-affinity-sum-display" style="text-align:center; color:var(--gold); font-weight:bold; font-size:1.1em; margin-top:-10px; margin-bottom:20px;">Total Afinidades: 0</div>
        
        <button type="button" onclick="window.ejecutarCreacionNPC()" style="width:100%; max-width:400px; margin-top:30px; background:var(--gold); color:black; font-weight:bold; font-size:1.2em; padding:15px; border-radius:4px;">✨ CREAR PERSONAJE ✨</button>
    </div>`;
}

export function dibujarFormularioEditar() {
    return `<p>Editor movido a Modal OP en la ficha.</p>`;
}
