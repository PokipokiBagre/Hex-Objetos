import { statsGlobal, listaEstados, estadoUI } from './stats-state.js';
import { calcularVidaRojaMax, calcularVexMax } from './stats-logic.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
const calcTotal = (base, spells, spellEff, buff) => (base || 0) + (spells || 0) + (spellEff || 0) + (buff || 0);

const bTextSplit = (spells, spellEff, buff) => {
    let html = '';
    if (spells !== 0) html += `<span style="color:#d4af37; font-size:0.65em; display:block; margin-top:2px; font-weight:bold;">(${spells > 0 ? '+' : ''}${spells})</span>`;
    if (spellEff !== 0) html += `<span style="color:#4a90e2; font-size:0.65em; display:block; margin-top:2px; font-weight:bold;">(${spellEff > 0 ? '+' : ''}${spellEff})</span>`;
    if (buff !== 0) html += `<span style="color:${buff > 0 ? '#00ff00' : '#ff4444'}; font-size:0.65em; display:block; margin-top:2px; font-weight:bold;">(${buff > 0 ? '+' : ''}${buff})</span>`;
    return html;
};

const imgError = "this.onerror=null; this.src='../img/imgobjetos/no_encontrado.png'";

function asegurarEstructuras(p) {
    if(!p.buffs) p.buffs = {}; 
    if(!p.hechizos) p.hechizos = {}; 
    if(!p.hechizosEfecto) p.hechizosEfecto = {}; 
    if(!p.estados) p.estados = {};
    
    listaEstados.forEach(e => { if (p.estados[e.id] === undefined) p.estados[e.id] = (e.tipo === 'numero') ? 0 : false; });
    
    const props = ['fisica', 'energetica', 'espiritual', 'mando', 'psiquica', 'oscura', 'danoRojo', 'danoAzul', 'elimDorada', 'vidaRojaMaxExtra', 'vidaAzulExtra', 'guardaDoradaExtra'];
    props.forEach(pr => { 
        p.buffs[pr] = p.buffs[pr] || 0; 
        p.hechizos[pr] = p.hechizos[pr] || 0; 
        p.hechizosEfecto[pr] = p.hechizosEfecto[pr] || 0; 
        if (p.afinidades && p.afinidades[pr] === undefined) p.afinidades[pr] = 0; 
    });
    if(p.isActive === undefined) p.isActive = true;
}

export function dibujarCatalogo() {
    const contenedor = document.getElementById('vista-catalogo');
    contenedor.className = ''; 
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

    const getSortValue = (p) => {
        if (p.isPlayer && p.isActive) return 1; 
        if (!p.isPlayer && p.isActive) return 2; 
        if (!p.isPlayer && !p.isActive) return 3; 
        if (p.isPlayer && !p.isActive) return 4; 
        return 5;
    };

    const sortedNames = Object.keys(statsGlobal).sort((a, b) => {
        const valA = getSortValue(statsGlobal[a]);
        const valB = getSortValue(statsGlobal[b]);
        if (valA !== valB) return valA - valB;
        return a.localeCompare(b); 
    });

    sortedNames.forEach(nombre => {
        const p = statsGlobal[nombre]; asegurarEstructuras(p);
        if (estadoUI.filtroRol === 'Jugador' && !p.isPlayer) return;
        if (estadoUI.filtroRol === 'NPC' && p.isPlayer) return;
        if (estadoUI.filtroAct === 'Activo' && !p.isActive) return;
        if (estadoUI.filtroAct === 'Inactivo' && p.isActive) return;

        const iconoMuestra = normalizar(p.iconoOverride || nombre);
        
        let borderStyle = "";
        let bgStyle = "background: #1e0535;"; 
        if (p.isPlayer && p.isActive) {
            borderStyle = "border: 2px solid var(--gold); box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);";
        } else if (!p.isPlayer && p.isActive) {
            borderStyle = "border: 2px solid #00ffff; box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);"; 
            bgStyle = "background: #0a1128;";
        } else if (!p.isPlayer && !p.isActive) {
            borderStyle = "border: 2px solid #555555;"; 
            bgStyle = "background: #111111;";
        } else if (p.isPlayer && !p.isActive) {
            borderStyle = "border: 2px solid #cc0000; box-shadow: 0 0 10px rgba(204, 0, 0, 0.3);"; 
            bgStyle = "background: #220000;";
        }

        const claseInactiva = p.isActive ? '' : 'inactive-card';
        
        html += `
        <div class="char-card ${claseInactiva}" style="${borderStyle} ${bgStyle}" onclick="window.abrirDetalle('${nombre}')">
            <img src="../img/imgpersonajes/${iconoMuestra}icon.png" onerror="${imgError}">
            <h3>${nombre}</h3>
            <p>HEX: <strong>${p.hex}</strong> | VEX: <strong>${calcularVexMax(p)}</strong></p>
        </div>`;
    }); 
    contenedor.innerHTML = html + `</div>`;
}

export function dibujarDetalle() {
    const nombre = estadoUI.personajeSeleccionado; const p = statsGlobal[nombre];
    if(!p) return; asegurarEstructuras(p);
    const contenedor = document.getElementById('vista-detalle');

    let vidaRojaVisual = calcularVidaRojaMax(p); 
    let vexVisual = calcularVexMax(p);
    let hexPercent = Math.min((p.hex / 4000) * 100, 100); let vexPercent = Math.min((vexVisual / 4000) * 100, 100);
    
    let extraRojo = Math.max(0, p.vidaRojaActual - vidaRojaVisual); 
    let normalRojo = Math.min(p.vidaRojaActual, vidaRojaVisual); 
    let vaciosRojo = Math.max(0, vidaRojaVisual - normalRojo);
    let corazonesRojosHTML = ''; 
    for(let i=0; i<normalRojo; i++) corazonesRojosHTML += `<div class="heart-red"></div>`; 
    for(let i=0; i<vaciosRojo; i++) corazonesRojosHTML += `<div class="heart-red empty"></div>`; 
    for(let i=0; i<extraRojo; i++) corazonesRojosHTML += `<div class="heart-red" style="background:#800000; border:1px solid #ff0000; transform:scale(0.9);"></div>`;
    if (extraRojo > 0) corazonesRojosHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraRojo}</div>`;

    let normalAzul = Math.max(0, p.vidaAzul || 0); 
    let extraAzul = Math.max(0, (p.hechizos.vidaAzulExtra||0) + (p.hechizosEfecto.vidaAzulExtra||0) + (p.buffs.vidaAzulExtra||0));
    let corazonesAzulesHTML = ''; 
    for(let i=0; i<normalAzul; i++) corazonesAzulesHTML += `<div class="heart-blue"></div>`; 
    for(let i=0; i<extraAzul; i++) corazonesAzulesHTML += `<div class="heart-blue" style="background:#1a4b8c; border:1px solid #4a90e2; transform:scale(0.9);"></div>`;
    if (extraAzul > 0) corazonesAzulesHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraAzul}</div>`;

    let normalGuarda = Math.max(0, p.guardaDorada || 0); 
    let extraGuarda = Math.max(0, (p.hechizos.guardaDoradaExtra||0) + (p.hechizosEfecto.guardaDoradaExtra||0) + (p.buffs.guardaDoradaExtra||0));
    let guardasHTML = ''; 
    for(let i=0; i<normalGuarda; i++) guardasHTML += `<div class="guard-gold"></div>`; 
    for(let i=0; i<extraGuarda; i++) guardasHTML += `<div class="guard-gold" style="background:#8b6508; border:1px solid #d4af37; transform: rotate(45deg) scale(0.8);"></div>`;
    if (extraGuarda > 0) guardasHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraGuarda}</div>`;

    let estadosHTML = ''; 

    if (p.iconoOverride) {
        estadosHTML += `<div class="status-badge" style="background:#2e004f; border: 1px dashed var(--gold); color:var(--gold);">COPIA DE: ${p.iconoOverride.toUpperCase()}<span class="tooltiptext">Este personaje es un clon visual de ${p.iconoOverride.toUpperCase()}</span></div>`;
    }

    listaEstados.forEach(e => {
        let val = p.estados[e.id];
        if (e.tipo === 'numero' && val > 0) {
            estadosHTML += `<div class="status-badge" style="background:${e.bg}; border-color:${e.border}; color:#fff;">${e.nombre} (${val})<span class="tooltiptext">${e.desc}</span></div>`;
        } else if (e.tipo === 'booleano' && val) {
            let colorTexto = e.id === 'huesos' ? '#000' : '#fff';
            let bStyle = e.id === 'secuestrado' ? 'dashed' : 'solid';
            estadosHTML += `<div class="status-badge" style="background:${e.bg}; border: 1px ${bStyle} ${e.border}; color:${colorTexto};">${e.nombre}<span class="tooltiptext">${e.desc}</span></div>`;
        }
    });

    const iconoGrande = normalizar(p.iconoOverride || nombre);

    let html = `
    <div style="display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #d4af37; padding-bottom: 20px; opacity:${p.isActive ? '1' : '0.5'};">
        <img src="../img/imgpersonajes/${iconoGrande}icon.png" style="width: 120px; border-radius: 50%; border: 3px solid #d4af37;" onerror="${imgError}">
        <div style="text-align:left;">
            <h1 style="margin: 0;">${nombre.toUpperCase()} ${p.isNPC ? '<span style="font-size:0.4em; color:#aaa">[NPC]</span>' : ''} ${!p.isActive ? '<span style="font-size:0.4em; color:#ff0000">[INACTIVO]</span>' : ''}</h1>
            <div class="status-container">${estadosHTML}</div>
        </div>
        ${estadoUI.esAdmin ? `<button onclick="window.mostrarPaginaOP('editar')" style="margin-left:auto; background:#1a0033; border-color:#d4af37;">Editar Ficha Base</button>` : ''}
    </div>

    <div class="circle-wrap">
        <div class="stat-circle" style="background: conic-gradient(var(--gold) ${hexPercent}%, #222 0);"><div class="inner"><strong>${p.hex}</strong><span>HEX</span></div></div>
        <div class="stat-circle" style="background: conic-gradient(var(--blue-life) ${vexPercent}%, #222 0);"><div class="inner"><strong>${vexVisual}</strong><span>VEX</span></div></div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div>
            <h3 style="margin-top:0;">Vitalidad</h3>
            <div class="health-box"><label style="color:var(--red-life);">VIDA ROJA (${p.vidaRojaActual}/${vidaRojaVisual})</label><div class="health-grid">${corazonesRojosHTML}</div></div>
            <div class="health-box"><label style="color:var(--blue-life);">VIDA AZUL (${normalAzul + extraAzul})</label><div class="health-grid">${corazonesAzulesHTML}</div></div>
            <div class="health-box"><label style="color:var(--gold);">GUARDA DORADA (${normalGuarda + extraGuarda})</label><div class="health-grid">${guardasHTML}</div></div>
            
            <h3 style="margin-top:20px;">Ofensiva Totales</h3>
            <div class="affinities-grid">
                <div class="affinity-box"><label style="color:var(--red-life)">Daño Rojo</label><span style="font-size:1.4em;">${calcTotal(p.danoRojo, p.hechizos.danoRojo, p.hechizosEfecto.danoRojo, p.buffs.danoRojo)}</span>${bTextSplit(p.hechizos.danoRojo, p.hechizosEfecto.danoRojo, p.buffs.danoRojo)}</div>
                <div class="affinity-box"><label style="color:var(--blue-life)">Daño Azul</label><span style="font-size:1.4em;">${calcTotal(p.danoAzul, p.hechizos.danoAzul, p.hechizosEfecto.danoAzul, p.buffs.danoAzul)}</span>${bTextSplit(p.hechizos.danoAzul, p.hechizosEfecto.danoAzul, p.buffs.danoAzul)}</div>
                <div class="affinity-box"><label style="color:var(--gold)">Elim. Dorada</label><span style="font-size:1.4em;">${calcTotal(p.elimDorada, p.hechizos.elimDorada, p.hechizosEfecto.elimDorada, p.buffs.elimDorada)}</span>${bTextSplit(p.hechizos.elimDorada, p.hechizosEfecto.elimDorada, p.buffs.elimDorada)}</div>
            </div>
        </div>
        <div>
            <h3 style="margin-top:0;">Afinidades Totales</h3>
            <div class="affinities-grid">
                <div class="affinity-box"><label>Física</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.fisica, p.hechizos.fisica, p.hechizosEfecto.fisica, p.buffs.fisica)}</span>${bTextSplit(p.hechizos.fisica, p.hechizosEfecto.fisica, p.buffs.fisica)}</div>
                <div class="affinity-box"><label>Energética</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.energetica, p.hechizos.energetica, p.hechizosEfecto.energetica, p.buffs.energetica)}</span>${bTextSplit(p.hechizos.energetica, p.hechizosEfecto.energetica, p.buffs.energetica)}</div>
                <div class="affinity-box"><label>Espiritual</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.espiritual, p.hechizos.espiritual, p.hechizosEfecto.espiritual, p.buffs.espiritual)}</span>${bTextSplit(p.hechizos.espiritual, p.hechizosEfecto.espiritual, p.buffs.espiritual)}</div>
                <div class="affinity-box"><label>Mando</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.mando, p.hechizos.mando, p.hechizosEfecto.mando, p.buffs.mando)}</span>${bTextSplit(p.hechizos.mando, p.hechizosEfecto.mando, p.buffs.mando)}</div>
                <div class="affinity-box"><label>Psíquica</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.psiquica, p.hechizos.psiquica, p.hechizosEfecto.psiquica, p.buffs.psiquica)}</span>${bTextSplit(p.hechizos.psiquica, p.hechizosEfecto.psiquica, p.buffs.psiquica)}</div>
                <div class="affinity-box"><label>Oscura</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.oscura, p.hechizos.oscura, p.hechizosEfecto.oscura, p.buffs.oscura)}</span>${bTextSplit(p.hechizos.oscura, p.hechizosEfecto.oscura, p.buffs.oscura)}</div>
            </div>
        </div>
    </div>
    
    <div style="margin-top:30px; background:#0a0014; border:1px solid var(--gold); padding:20px; border-radius:8px;">
        <h3 style="margin-top:0; color:var(--gold); text-align:center;">Acciones Rápidas (Vida y Energía)</h3>
        <div class="edit-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
            <div class="edit-card">
                <h4>Ganancia HEX</h4>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modLibre('hex', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modLibre('hex', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modLibre('hex', 10)">+10</button><button type="button" class="btn-minus" onclick="window.modLibre('hex', -10)">-10</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#004a4a;" onclick="window.modLibre('hex', 50)">+50</button><button type="button" class="btn-minus" style="background:#4a0000;" onclick="window.modLibre('hex', -50)">-50</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#004a4a;" onclick="window.modLibre('hex', 100)">+100</button><button type="button" class="btn-minus" style="background:#4a0000;" onclick="window.modLibre('hex', -100)">-100</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#4a004a;" onclick="window.modLibre('hex', 500)">+500</button><button type="button" class="btn-minus" style="background:#4a004a;" onclick="window.modLibre('hex', -500)">-500</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#4a004a;" onclick="window.modLibre('hex', 1000)">+1000</button><button type="button" class="btn-minus" style="background:#4a004a;" onclick="window.modLibre('hex', -1000)">-1000</button></div>
            </div>
            <div class="edit-card">
                <h4>Vida Roja (Actual)</h4>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 1)">+1 (Cura)</button><button type="button" class="btn-minus" onclick="window.modLibre('vidaRojaActual', -1)">-1 (Daño)</button></div>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 5)">+5 (Cura)</button><button type="button" class="btn-minus" onclick="window.modLibre('vidaRojaActual', -5)">-5 (Daño)</button></div>
            </div>
            <div class="edit-card">
                <h4>Corazones Azules Base</h4>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modLibre('vidaAzul', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modLibre('vidaAzul', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" onclick="window.modLibre('vidaAzul', 5)">+5</button><button type="button" class="btn-minus5" onclick="window.modLibre('vidaAzul', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>C. Azules <span style="color:#00ff00">(EXTRA)</span></h4>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#330066;" onclick="window.modBlueExtra(1)">+1</button><button type="button" class="btn-minus" onclick="window.modBlueExtra(-1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" style="background:#004a4a;" onclick="window.modBlueExtra(5)">+5</button><button type="button" class="btn-minus5" onclick="window.modBlueExtra(-5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>Guarda Dorada Base</h4>
                <div class="btn-row"><button type="button" class="btn-plus" onclick="window.modLibre('guardaDorada', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modLibre('guardaDorada', -1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" onclick="window.modLibre('guardaDorada', 5)">+5</button><button type="button" class="btn-minus5" onclick="window.modLibre('guardaDorada', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>Guarda Dorada <span style="color:#00ff00">(EXTRA)</span></h4>
                <div class="btn-row"><button type="button" class="btn-plus" style="background:#330066;" onclick="window.modGoldExtra(1)">+1</button><button type="button" class="btn-minus" onclick="window.modGoldExtra(-1)">-1</button></div>
                <div class="btn-row"><button type="button" class="btn-plus5" style="background:#004a4a;" onclick="window.modGoldExtra(5)">+5</button><button type="button" class="btn-minus5" onclick="window.modGoldExtra(-5)">-5</button></div>
            </div>
        </div>
    </div>`;

    const pVidaDanoE = [ { id: 'vidaRojaMaxExtra', label: 'Límite Rojo Extra', val: p.buffs.vidaRojaMaxExtra }, { id: 'danoRojo', label: 'Daño Rojo Extra', val: p.buffs.danoRojo }, { id: 'danoAzul', label: 'Daño Azul Extra', val: p.buffs.danoAzul }, { id: 'elimDorada', label: 'Elim. Dorada Extra', val: p.buffs.elimDorada } ];
    const pAfinidadesE = [ { id: 'fisica', label: 'Afin. Física Extra', val: p.buffs.fisica }, { id: 'energetica', label: 'Afin. Energética Extra', val: p.buffs.energetica }, { id: 'espiritual', label: 'Afin. Espiritual Extra', val: p.buffs.espiritual }, { id: 'mando', label: 'Afin. Mando Extra', val: p.buffs.mando }, { id: 'psiquica', label: 'Afin. Psíquica Extra', val: p.buffs.psiquica }, { id: 'oscura', label: 'Afin. Oscura Extra', val: p.buffs.oscura } ];

    html += `
    <div style="margin-top:20px; background:#110022; border:1px solid #00ffff; padding:20px; border-radius:8px;">
        <h3 style="margin-top:0; color:#00ffff; text-align:center;">Alteraciones Temporales (Extras)</h3>
        <p style="color:#aaa; font-size:0.85em; text-align:center; margin-bottom:20px;">Estos valores representan buffs aplicados sobre la base.</p>
        <h4 style="color:#fff; border-bottom:1px dashed #004a4a; padding-bottom:5px; text-align:left; margin-bottom:15px; font-family:'Cinzel', serif;">1. Buffs de Vida y Daño</h4>
        <div class="edit-grid" style="margin-bottom: 30px;">${pVidaDanoE.map(f => genCard(f, 'buff')).join('')}</div>
        <h4 style="color:#fff; border-bottom:1px dashed #004a4a; padding-bottom:5px; text-align:left; margin-bottom:15px; font-family:'Cinzel', serif;">2. Afinidades Temporales</h4>
        <div class="edit-grid" style="margin-bottom: 10px;">${pAfinidadesE.map(f => genCard(f, 'buff')).join('')}</div>
    </div>`;

    let opcionesPersonajes = Object.keys(statsGlobal).filter(n => n !== nombre).map(n => `<option value="${n}">${n}</option>`).join('');
    html += `
    <div style="margin-top:20px; background:#1a0033; border:1px dashed #d4af37; padding:15px; border-radius:8px; text-align:center;">
        <h3 style="margin-top:0; color:var(--gold);">Importación desde Personaje</h3>
        <p style="color:#aaa; font-size:0.85em; margin-bottom:10px;">Importa estados alterados, clona toda la ficha o copia atributos específicos <b>desde</b> otro personaje hacia <b>${nombre}</b>.</p>
        <div style="display:flex; justify-content:center; align-items:center; gap:10px; flex-wrap:wrap;">
            <select id="clon-source" style="padding:10px; background:#000; color:white; border:1px solid var(--gold); font-family:'Cinzel'; min-width:200px;"><option value="" disabled selected>-- Selecciona Origen --</option>${opcionesPersonajes}</select>
            <button type="button" onclick="window.ejecutarClonacion('estados')" style="background:#004a4a; border:1px solid #00ffff; padding:10px 15px; color:white; font-weight:bold; transition:0.2s;">Importar Estados</button>
            <button type="button" onclick="window.ejecutarClonacion('efectosExtras')" style="background:#4a90e2; border:1px solid #00ffff; padding:10px 15px; color:#111; font-weight:bold; transition:0.2s;">Copiar Efectos y Extras</button>
            <button type="button" onclick="window.ejecutarClonacion('hex')" style="background:#b8860b; border:1px solid #ffd700; padding:10px 15px; color:#000; font-weight:bold; transition:0.2s;">Copiar HEX</button>
            <button type="button" onclick="window.ejecutarClonacion('completo')" style="background:#4a004a; border:1px solid #8a008a; padding:10px 15px; color:white; font-weight:bold; transition:0.2s;">Clonar Todo (Inc. Imagen)</button>
        </div>
    </div>`;

    contenedor.innerHTML = html;
}

export function dibujarMenuOP() {
    return `
        <h3>PANEL DE OPERADOR</h3>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;">
            <button type="button" onclick="window.mostrarPaginaOP('crear')" style="background:#004a4a">Crear Personaje (Manual)</button>
            <button type="button" onclick="window.descargarAumentada()">Descargar CSV</button>
            <button type="button" onclick="window.triggerSubirCSV()" class="btn-red">Subir CSV</button>
        </div>
        <div id="sub-vista-op"></div>
    `;
}

function genCard(f, tipoAccion) {
    let btns = ''; let clickMod = '';
    if (tipoAccion === 'buff') clickMod = 'window.modificarBuff'; 
    else if (tipoAccion === 'directo') clickMod = 'window.modificarDirecto'; 
    else if (tipoAccion === 'baseTop') clickMod = 'window.modBaseTop'; 
    else if (tipoAccion === 'baseAfin') clickMod = 'window.modBaseAfin'; 
    else if (tipoAccion === 'spellTop') clickMod = 'window.modSpellTop'; 
    else if (tipoAccion === 'spellAfin') clickMod = 'window.modSpellAfin'; 
    else if (tipoAccion === 'spellEffTop') clickMod = 'window.modSpellEffTop'; 
    else if (tipoAccion === 'spellEffAfin') clickMod = 'window.modSpellEffAfin'; 
    else if (tipoAccion === 'form') clickMod = 'window.modForm';

    const visualVal = f.val !== undefined ? f.val : 0;
    
    const inputId = tipoAccion === 'form' ? f.id : `inp-${tipoAccion}-${f.id}`;
    
    // MODIFICADO: Ahora el oninput en el formulario lanza los auto-cálculos reactivos
    const attrInput = tipoAccion === 'form' ? `oninput="window.modFormInput('${inputId}')"` : `onchange="window.cambioManual('${f.id}', this.value, '${tipoAccion}')"`;
    const paramId = tipoAccion === 'form' ? inputId : f.id;
    
    let inputHtml = `<input type="number" id="${inputId}" value="${visualVal}" ${attrInput} style="width:80%; text-align:center; background:#000; color:white; border:1px dashed var(--gold); margin-bottom:10px; font-size:1.5em; padding:5px; box-sizing:border-box;">`;

    if (f.esHex) {
        btns = `<div class="btn-row"><button type="button" class="btn-plus" onclick="${clickMod}('${paramId}', 10)">+10</button><button type="button" class="btn-minus" onclick="${clickMod}('${paramId}', -10)">-10</button></div><div class="btn-row"><button type="button" class="btn-plus" onclick="${clickMod}('${paramId}', 50)">+50</button><button type="button" class="btn-minus" onclick="${clickMod}('${paramId}', -50)">-50</button></div><div class="btn-row"><button type="button" class="btn-plus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${paramId}', 100)">+100</button><button type="button" class="btn-minus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${paramId}', -100)">-100</button></div>`;
    } else {
        btns = `<div class="btn-row"><button type="button" class="btn-plus" onclick="${clickMod}('${paramId}', 1)">+1</button><button type="button" class="btn-minus" onclick="${clickMod}('${paramId}', -1)">-1</button></div><div class="btn-row"><button type="button" class="btn-plus5" onclick="${clickMod}('${paramId}', 5)">+5</button><button type="button" class="btn-minus5" onclick="${clickMod}('${paramId}', -5)">-5</button></div><div class="btn-row"><button type="button" class="btn-plus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${paramId}', 10)">+10</button><button type="button" class="btn-minus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${paramId}', -10)">-10</button></div>`;
    }
    return `<div class="edit-card"><h4>${f.label}</h4>${inputHtml}${btns}</div>`;
}

export function dibujarFormularioCrear() {
    const pEnergia = [ { id:'npc-hex', label:'HEX Inicial', val:0, esHex:true }, { id:'npc-vex', label:'VEX Inicial', val:0, esHex:true } ];
    
    // MODIFICADO: Daño Rojo arranca en 1 por defecto
    const pVidaDano = [ { id:'npc-vra', label:'Corazones Actuales', val:10 }, { id:'npc-vrm', label:'Corazones (Límite Máx)', val:10 }, { id:'npc-va', label:'Corazones Azules', val:0 }, { id:'npc-gd', label:'Guarda Dorada', val:0 }, { id:'npc-dr', label:'Daño Rojo', val:1 }, { id:'npc-da', label:'Daño Azul', val:0 }, { id:'npc-ed', label:'Elim. Dorada', val:0 } ];
    const pAfinidades = [ { id:'npc-fis', label:'Afin. Física', val:0 }, { id:'npc-ene', label:'Afin. Energética', val:0 }, { id:'npc-esp', label:'Afin. Espiritual', val:0 }, { id:'npc-man', label:'Afin. Mando', val:0 }, { id:'npc-psi', label:'Afin. Psíquica', val:0 }, { id:'npc-osc', label:'Afin. Oscura', val:0 } ];
    
    return `
    <div style="text-align:center; max-width:1000px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Forja de Personaje</h3>
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
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">3. Afinidades Base</h3><div class="edit-grid" style="margin-bottom: 20px;">${pAfinidades.map(f => genCard(f, 'form')).join('')}</div>
        <button type="button" onclick="window.ejecutarCreacionNPC()" style="width:100%; max-width:400px; margin-top:30px; background:var(--gold); color:black; font-weight:bold; font-size:1.2em; padding:15px;">CREAR PERSONAJE</button>
    </div>`;
}

export function dibujarFormularioEditar() {
    const p = statsGlobal[estadoUI.personajeSeleccionado];
    if(!p) return `<p>Selecciona un personaje en el catálogo primero.</p>`;
    asegurarEstructuras(p);
    
    const pVidaDanoBase = [ { id: 'vidaRojaMax', label: 'Límite Rojo Base', val: p.vidaRojaMax }, { id: 'baseVidaAzul', label: 'C. Azules Base', val: p.baseVidaAzul }, { id: 'baseGuardaDorada', label: 'G. Dorada Base', val: p.baseGuardaDorada }, { id: 'danoRojo', label: 'Daño Rojo Base', val: p.danoRojo }, { id: 'danoAzul', label: 'Daño Azul Base', val: p.danoAzul }, { id: 'elimDorada', label: 'Elim. Dorada Base', val: p.elimDorada } ];
    const pAfinidadesBase = [ { id: 'fisica', label: 'Física Base', val: p.afinidades.fisica }, { id: 'energetica', label: 'Energética Base', val: p.afinidades.energetica }, { id: 'espiritual', label: 'Espiritual Base', val: p.afinidades.espiritual }, { id: 'mando', label: 'Mando Base', val: p.afinidades.mando }, { id: 'psiquica', label: 'Psíquica Base', val: p.afinidades.psiquica }, { id: 'oscura', label: 'Oscura Base', val: p.afinidades.oscura } ];

    const pVitalidadSpell = [ { id: 'vidaRojaMaxExtra', label: 'Límite Rojo (Conteo)', val: p.hechizos.vidaRojaMaxExtra } ];
    const pAfinidadesSpell = [ { id: 'fisica', label: 'Física (Conteo)', val: p.hechizos.fisica }, { id: 'energetica', label: 'Energética (Conteo)', val: p.hechizos.energetica }, { id: 'espiritual', label: 'Espiritual (Conteo)', val: p.hechizos.espiritual }, { id: 'mando', label: 'Mando (Conteo)', val: p.hechizos.mando }, { id: 'psiquica', label: 'Psíquica (Conteo)', val: p.hechizos.psiquica }, { id: 'oscura', label: 'Oscura (Conteo)', val: p.hechizos.oscura } ];

    const pVitalidadSpellEff = [ { id: 'vidaRojaMaxExtra', label: 'Límite Rojo (Efecto)', val: p.hechizosEfecto.vidaRojaMaxExtra } ];
    const pAfinidadesSpellEff = [ { id: 'fisica', label: 'Física (Efecto)', val: p.hechizosEfecto.fisica }, { id: 'energetica', label: 'Energética (Efecto)', val: p.hechizosEfecto.energetica }, { id: 'espiritual', label: 'Espiritual (Efecto)', val: p.hechizosEfecto.espiritual }, { id: 'mando', label: 'Mando (Efecto)', val: p.hechizosEfecto.mando }, { id: 'psiquica', label: 'Psíquica (Efecto)', val: p.hechizosEfecto.psiquica }, { id: 'oscura', label: 'Oscura (Efecto)', val: p.hechizosEfecto.oscura } ];

    let normalAzul = Math.max(0, p.vidaAzul || 0); 
    let extraAzul = Math.max(0, (p.hechizos.vidaAzulExtra||0) + (p.hechizosEfecto.vidaAzulExtra||0) + (p.buffs.vidaAzulExtra||0));
    let totalAzul = normalAzul + extraAzul;
    let normalGuarda = Math.max(0, p.guardaDorada || 0); 
    let extraGuarda = Math.max(0, (p.hechizos.guardaDoradaExtra||0) + (p.hechizosEfecto.guardaDoradaExtra||0) + (p.buffs.guardaDoradaExtra||0));
    let totalGuarda = normalGuarda + extraGuarda;
    
    const iconoGrande = normalizar(p.iconoOverride || estadoUI.personajeSeleccionado);
    
    let copiaBadge = '';
    if (p.iconoOverride) {
        copiaBadge = `<span style="font-size:0.5em; color:#d4af37; border: 1px dashed #d4af37; padding: 2px 6px; border-radius:4px; vertical-align:middle; margin-left:10px;">COPIA DE: ${p.iconoOverride.toUpperCase()}</span>`;
    }

    let html = `
    <div style="text-align:center; max-width:1000px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Edición de Ficha Base y Hechizos</h3>
        <button type="button" onclick="window.abrirDetalle('${estadoUI.personajeSeleccionado}')" style="background:#444; margin-bottom: 15px;">⬅ Volver al Perfil</button>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; background: rgba(30, 0, 60, 0.6); padding: 15px; border: 1px dashed var(--gold); border-radius: 8px; margin-bottom: 20px;">
            <img src="../img/imgpersonajes/${iconoGrande}icon.png" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--gold); object-fit: cover;" onerror="${imgError}">
            <div style="text-align: left;">
                <h2 style="margin: 0; color: var(--gold); font-size: 1.5em;">${estadoUI.personajeSeleccionado.toUpperCase()}${copiaBadge}</h2>
                <div style="font-size: 1.1em; margin-top: 5px; background: #000; padding: 5px 10px; border-radius: 4px; border: 1px solid #333;">
                    <span style="color:var(--red-life); font-weight:bold;">❤️ ${p.vidaRojaActual} / ${calcularVidaRojaMax(p)}</span> &nbsp;|&nbsp; 
                    <span style="color:var(--blue-life); font-weight:bold;">🔷 ${totalAzul}</span> &nbsp;|&nbsp; 
                    <span style="color:var(--gold); font-weight:bold;">🛡️ ${totalGuarda}</span>
                </div>
            </div>
        </div>

        <div style="background:#1a0033; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid var(--gold);">
            <h3 style="color:var(--gold); margin-top:0;">Identidad y Estado del Personaje</h3>
            <div style="display:flex; justify-content:center; gap:20px;">
                <button type="button" onclick="window.toggleIdentidad('isPlayer')" style="width:150px; background:${p.isPlayer ? '#004a00' : '#4a0000'}; border-color:${p.isPlayer ? '#00ff00' : '#ff0000'}; color:white;">${p.isPlayer ? 'ROL: JUGADOR' : 'ROL: NPC'}</button>
                <button type="button" onclick="window.toggleIdentidad('isActive')" style="width:150px; background:${p.isActive ? '#004a00' : '#4a0000'}; border-color:${p.isActive ? '#00ff00' : '#ff0000'}; color:white;">${p.isActive ? 'ESTADO: ACTIVO' : 'ESTADO: INACTIVO'}</button>
            </div>
        </div>

        <div style="background:#0a0014; border:1px solid var(--gold); padding:15px; margin-bottom:20px; border-radius:8px; display:flex; flex-wrap:wrap; justify-content:center; gap:15px; font-size:1.1em;">
            <div style="width:100%; text-align:center; color:#aaa; font-size:0.8em; margin-bottom:5px;">VISTA DE TOTALES (Incluye Base, Conteo, Efecto y Extras)</div>
            <span>Física: <b style="color:var(--gold)">${calcTotal(p.afinidades.fisica, p.hechizos.fisica, p.hechizosEfecto.fisica, p.buffs.fisica)}</b></span>
            <span>Energética: <b style="color:var(--gold)">${calcTotal(p.afinidades.energetica, p.hechizos.energetica, p.hechizosEfecto.energetica, p.buffs.energetica)}</b></span>
            <span>Espiritual: <b style="color:var(--gold)">${calcTotal(p.afinidades.espiritual, p.hechizos.espiritual, p.hechizosEfecto.espiritual, p.buffs.espiritual)}</b></span>
            <span>Mando: <b style="color:var(--gold)">${calcTotal(p.afinidades.mando, p.hechizos.mando, p.hechizosEfecto.mando, p.buffs.mando)}</b></span>
            <span>Psíquica: <b style="color:var(--gold)">${calcTotal(p.afinidades.psiquica, p.hechizos.psiquica, p.hechizosEfecto.psiquica, p.buffs.psiquica)}</b></span>
            <span>Oscura: <b style="color:var(--gold)">${calcTotal(p.afinidades.oscura, p.hechizos.oscura, p.hechizosEfecto.oscura, p.buffs.oscura)}</b></span>
        </div>`;

    const pEnergiaBase = [ { id: 'hex', label: 'Base HEX', val: p.hex, esHex:true }, { id: 'vex', label: 'Base VEX', val: p.vex, esHex:true } ];
    html += `<h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">0. Energía Base</h3><div class="edit-grid" style="margin-bottom: 20px;">${pEnergiaBase.map(f => genCard(f, 'directo')).join('')}</div>`;

    html += `<h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top:30px;">Efectos de Estado</h3>
             <div class="edit-grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); margin-bottom:20px;">`;
    
    listaEstados.forEach(e => {
        let val = p.estados[e.id];
        if (e.tipo === 'numero') { html += `<div class="edit-card"><h4>${e.nombre}</h4><span style="color:${e.border}; font-size:1.5em; font-weight:bold;">${val}</span><div class="btn-row"><button type="button" class="btn-plus" onclick="window.modEstado('${e.id}', 1)">+1</button><button type="button" class="btn-minus" onclick="window.modEstado('${e.id}', -1)">-1</button></div></div>`; } 
        else { let extraStyle = val ? `background:${e.bg}; color:${e.id==='huesos'?'#000':'#fff'}; border-color:${e.border};` : ''; html += `<button type="button" class="status-toggle ${val ? 'active' : ''}" style="${extraStyle}" onclick="window.toggleEstado('${e.id}')">${e.nombre}</button>`; }
    });
    html += `</div>`;

    html += `<div style="border:1px solid #4a004a; padding:15px; margin-bottom:20px; border-radius:8px;">
                <h2 style="color:var(--gold); margin-top:0;">Cambiar Original (Valores Base Permanentes)</h2>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Vitalidad y Ofensiva Base</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pVidaDanoBase.map(f => genCard(f, 'baseTop')).join('')}</div>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Afinidades Base</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pAfinidadesBase.map(f => genCard(f, 'baseAfin')).join('')}</div>
             </div>
             
             <div style="border:1px solid #d4af37; padding:15px; margin-bottom:20px; border-radius:8px;">
                <h2 style="color:#d4af37; margin-top:0;">Cambiar Cantidad por Hechizos (Conteo)</h2>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Vitalidad por Conteo</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pVitalidadSpell.map(f => genCard(f, 'spellTop')).join('')}</div>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Afinidades por Conteo</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pAfinidadesSpell.map(f => genCard(f, 'spellAfin')).join('')}</div>
             </div>

             <div style="border:1px solid #4a90e2; padding:15px; margin-bottom:20px; border-radius:8px;">
                <h2 style="color:#4a90e2; margin-top:0;">Cambiar Efectos de Hechizos (Habilidades)</h2>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Vitalidad por Efecto</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pVitalidadSpellEff.map(f => genCard(f, 'spellEffTop')).join('')}</div>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Afinidades por Efecto</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pAfinidadesSpellEff.map(f => genCard(f, 'spellEffAfin')).join('')}</div>
             </div>
    </div>`;

    return html;
}
