import { db, estadoUI } from './inventario-state.js';
// IMPORTACIÓN CORREGIDA: Ya no llama a las funciones eliminadas
import { getInventarioCombinado, obtenerHechizosAprendibles } from './inventario-logic.js';

const normalizar = (str) => str ? str.toString().trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') : '';
const textNorm = (str) => str ? str.toString().trim().toLowerCase() : '';

function getColorAfinidad(af) {
    if(af === 'Física') return { b: '#8b4513', t: '#e2a673' };
    if(af === 'Energética') return { b: '#e67e22', t: '#f3b67a' };
    if(af === 'Espiritual') return { b: '#2ecc71', t: '#7df0a7' };
    if(af === 'Mando') return { b: '#3498db', t: '#a4d3f2' };
    if(af === 'Psíquica') return { b: '#9b59b6', t: '#dcb1f0' };
    if(af === 'Oscura') return { b: 'var(--purple-magic)', t: '#c285ff' };
    return { b: '#555', t: '#fff' };
}

const getSortValue = (p) => {
    if (p.isPlayer && p.isActive) return 1; if (!p.isPlayer && p.isActive) return 2; 
    if (!p.isPlayer && !p.isActive) return 3; if (p.isPlayer && !p.isActive) return 4; return 5;
};

// Exportado para que inventario-main.js también lo use al conjurar
export function getValInfo(info, possibleKeys) {
    if(!info) return null;
    const actualKeys = Object.keys(info);
    for(let pk of possibleKeys) {
        const matched = actualKeys.find(k => k.trim().toLowerCase() === pk.toLowerCase());
        if(matched && info[matched] && info[matched] !== '0' && info[matched] !== 0 && info[matched] !== 'Desconocido' && info[matched] !== 'null') {
            return info[matched];
        }
    }
    return null;
}

function generarDetalles(info) {
    const ov = getValInfo(info, ['overcast 100%', 'overcast']);
    const un = getValInfo(info, ['undercast 50%', 'undercast']);
    const es = getValInfo(info, ['especial', 'especiales']);
    
    if (!ov && !un && !es) return '';
    return `
    <details class="spell-details">
        <summary>Ver Detalles Adicionales</summary>
        <div class="details-content">
            ${ov ? `<div class="spell-extra"><strong>Overcast:</strong> ${ov}</div>` : ''}
            ${un ? `<div class="spell-extra"><strong>Undercast:</strong> ${un}</div>` : ''}
            ${es ? `<div class="spell-extra"><strong>Especial:</strong> ${es}</div>` : ''}
        </div>
    </details>`;
}

export function dibujarCatalogo() {
    let html = `<div class="catalogo-grid">`;
    Object.keys(db.personajes).sort((a, b) => {
        const valA = getSortValue(db.personajes[a]); const valB = getSortValue(db.personajes[b]);
        if (valA !== valB) return valA - valB; return a.localeCompare(b); 
    }).forEach(nombre => {
        const p = db.personajes[nombre];
        if (estadoUI.filtroRol === 'Jugador' && !p.isPlayer) return; if (estadoUI.filtroRol === 'NPC' && p.isPlayer) return;
        if (estadoUI.filtroAct === 'Activo' && !p.isActive) return; if (estadoUI.filtroAct === 'Inactivo' && p.isActive) return;

        const style = p.isPlayer && p.isActive ? 'player-active' : (p.isPlayer ? 'player-card' : '');
        
        html += `<div class="char-card ${style} ${p.isActive ? '' : 'inactive-card'}" onclick="window.abrirGrimorio('${nombre}')">
                    <img src="../img/imgpersonajes/${normalizar(p.iconoOverride)}icon.png" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                    <h3>${nombre}</h3>
                    <p class="char-stats"><strong style="color:var(--gold)">HEX:</strong> ${p.hex}</p>
                    <p class="char-stats"><strong>Grimorio:</strong> ${getInventarioCombinado(nombre).length} Hechizos</p>
                    <p class="char-stats"><strong>Af. Primaria:</strong> <span style="color:${getColorAfinidad(p.mayorAfinidad).t}">${p.mayorAfinidad}</span></p>
                 </div>`;
    });
    document.getElementById('grid-catalogo').innerHTML = html + `</div>`;
}

export function renderHeaders() {
    const pj = estadoUI.personajeSeleccionado; if(!pj) return;
    const char = db.personajes[pj];
    
    // Contadores arreglados para usar getInventarioCombinado
    const inv = getInventarioCombinado(pj);
    const todosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    const conteo = { 'Física': 0, 'Energética': 0, 'Espiritual': 0, 'Mando': 0, 'Psíquica': 0, 'Oscura': 0 };
    
    inv.forEach(item => {
        const itemNorm = textNorm(item.Hechizo);
        const info = todosNodos.find(n => textNorm(n.Nombre) === itemNorm || textNorm(n.ID) === itemNorm) || {};
        const af = item["Hechizo Afinidad"] || info.Afinidad;
        if(conteo[af] !== undefined) conteo[af]++;
    });

    let statsHTML = `<div style="display:flex; gap:10px; flex-wrap:wrap; font-size:0.75em; margin-top:8px; background:rgba(0,0,0,0.5); padding:6px 12px; border-radius:4px; border:1px solid #333; align-items:center;">`;
    statsHTML += `<span style="color:#aaa; font-weight:bold; letter-spacing:1px; margin-right:5px;">CANTIDAD DE HECHIZOS:</span>`;
    Object.keys(conteo).forEach(af => {
        const c = conteo[af]; const color = getColorAfinidad(af).t;
        statsHTML += `<span style="color:${color}; ${c === 0 ? 'opacity:0.3;' : `font-weight:bold; text-shadow: 0 0 5px ${color};`}">${af.toUpperCase()}: ${c}</span>`;
    });
    statsHTML += `</div>`;

    const btnArbol = char.isPlayer ? `<button onclick="window.cambiarVista('aprendizaje')" class="btn-nav" style="background:#004a4a; border-color:var(--cyan-magic);">✨ Árbol de Aprendizaje</button>` : '';
    // Nuevo Botón de Casteo
    const btnCastear = `<button onclick="window.cambiarVista('casteo')" class="btn-nav" style="background:#3a005a; border-color:#ff00ff; color:white;">🎲 Castear Hechizo</button>`;

    document.getElementById('header-grimorio').innerHTML = `
        <div class="player-header">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="../img/imgpersonajes/${normalizar(char.iconoOverride)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                <div><h2 style="margin:0;">${pj.toUpperCase()}</h2><p style="margin:5px 0 0 0; color:var(--gold);">HEX Disponible: <strong>${char.hex}</strong></p>${statsHTML}</div>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                ${btnArbol}
                ${btnCastear}
                ${estadoUI.esAdmin ? `<button onclick="window.cambiarVista('gestion')" class="btn-nav" style="background:#4a004a; border-color:var(--purple-magic);">⚙️ Asignar/Quitar (OP)</button>` : ''}
            </div>
        </div>`;
        
    document.getElementById('header-aprendizaje').innerHTML = `
        <button onclick="window.cambiarVista('grimorio')" class="btn-nav btn-volver" style="margin-bottom:20px;">⬅ Volver al Grimorio</button>
        <div class="player-header" style="justify-content:center;">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="../img/imgpersonajes/${normalizar(char.iconoOverride)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                <div><h2 style="margin:0;">ÁRBOL DE APRENDIZAJE</h2></div>
            </div>
        </div>`;

    document.getElementById('header-casteo').innerHTML = `
        <button onclick="window.cambiarVista('grimorio')" class="btn-nav btn-volver" style="margin-bottom:20px;">⬅ Volver al Grimorio</button>
        <div class="player-header">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="../img/imgpersonajes/${normalizar(char.iconoOverride)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                <div><h2 style="margin:0;">ZONA DE CONJURO: ${pj.toUpperCase()}</h2></div>
            </div>
        </div>`;

    document.getElementById('header-gestion').innerHTML = `
        <button onclick="window.cambiarVista('grimorio')" class="btn-nav btn-volver" style="margin-bottom:20px;">⬅ Volver al Grimorio</button>
        <div class="player-header">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="../img/imgpersonajes/${normalizar(char.iconoOverride)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                <div><h2 style="margin:0;">GESTIÓN OP: ${pj.toUpperCase()}</h2><p style="margin:5px 0 0 0; color:var(--gold);">HEX Actual: <strong>${char.hex}</strong></p>${statsHTML}</div>
            </div>
            <button onclick="window.descargarCSVHex()" class="btn-nav" style="background:#8b0000; color:white;">📥 DESCARGAR CSV (Afinidades/HEX)</button>
        </div>
        <label class="toggle-hex">
            <input type="checkbox" onchange="window.toggleRestarHex(this.checked)" ${estadoUI.restarHexAsignacion ? 'checked' : ''}>
            RESTAR COSTE DE HEX Y SUBIR AFINIDAD (+1) AL ASIGNAR HECHIZO
        </label>
        <div style="margin-bottom:20px; text-align:center; background:#1a0033; padding:15px; border:1px solid var(--gold); border-radius:8px; max-width:800px; margin:0 auto 30px auto;">
            <div style="margin-bottom:15px;">
                <label style="color:var(--gold); font-weight:bold; margin-right:10px;">FUENTE DEL HECHIZO (ORIGEN):</label>
                <select id="slicer-origen" class="search-bar" style="margin:0; width:auto; display:inline-block;">
                    <option value="Mapa Hex">Mapa Hex</option>
                    <option value="OP Admin">OP Admin</option>
                    ${Object.keys(db.personajes).sort().map(n => `<option value="${n}">${n}</option>`).join('')}
                </select>
            </div>
            <h4 style="color:#00ffff; margin:0 0 5px 0; text-align:left;">📋 Bitácora de Aprendizaje</h4>
            <textarea id="op-log-textarea" readonly style="width:100%; height:80px; background:#000; color:#fff; border:1px dashed var(--gold); padding:10px; font-family:monospace; box-sizing:border-box; margin-bottom:10px;"></textarea>
            <div style="display:flex; gap:10px;">
                <button onclick="window.copiarLogOP()" style="flex:3; background:var(--gold); color:black; font-weight:bold; padding:8px; border:none; cursor:pointer; border-radius:4px;">COPIAR AL PORTAPAPELES</button>
                <button onclick="window.limpiarLogOP()" style="flex:1; background:#8b0000; color:white; padding:8px; border:none; cursor:pointer; border-radius:4px;">LIMPIAR LOG</button>
            </div>
        </div>`;
}

export function dibujarGrimorioGrid() {
    const pj = estadoUI.personajeSeleccionado; 
    const inv = getInventarioCombinado(pj); 
    const todosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    const fAf = estadoUI.filtrosGrimorio.afinidad; const fTx = estadoUI.filtrosGrimorio.busqueda.toLowerCase();

    let html = ``;
    inv.filter(item => (fAf === 'Todos' || item["Hechizo Afinidad"] === fAf) && (!fTx || item.Hechizo.toLowerCase().includes(fTx)))
       .forEach(item => {
        const itemNorm = textNorm(item.Hechizo);
        const info = todosNodos.find(n => textNorm(n.Nombre) === itemNorm || textNorm(n.ID) === itemNorm) || {};
        
        // LÓGICA DE ENMASCARAMIENTO BASADA EN COLUMNA O (Pura, sin revisar Jugadores)
        const isPublicBase = info.Conocido && info.Conocido.toString().trim().toLowerCase() === 'si';
        const checkColaVis = estadoUI.colaCambios.toggleConocido.slice().reverse().find(c => c.Hechizo === (info.Nombre || item.Hechizo));
        const isKnown = checkColaVis ? (checkColaVis.Estado === 'si') : isPublicBase;
        
        const isHidden = !estadoUI.esAdmin && !isKnown;

        const col = getColorAfinidad(item["Hechizo Afinidad"] || info.Afinidad);
        const clase = info.Clase || 'Clase -';
        const isTemporal = item.Tipo && item.Tipo !== 'Normal' ? `<br><i>Hechizo ${item.Tipo}</i>` : '';

        const tituloReal = (info.Nombre && info.Nombre.trim() !== '') ? info.Nombre : item.Hechizo;
        const titulo = isHidden ? (info.ID || item.Hechizo) : tituloReal;

        const res = isHidden ? '<i style="color:#ff4444;">Información Sellada (Hechizo no descubierto).</i>' : getValInfo(info, ['resumen', 'Resumen']);
        const efe = isHidden ? '' : getValInfo(info, ['efecto', 'Efecto']);
        const detailsHTML = isHidden ? '' : generarDetalles(info);
        
        const btnVis = (estadoUI.esAdmin && info.Nombre) ? `<button onclick="window.accionCola('toggle_conocido', '${info.Nombre}', '', 0, '${isKnown ? 'no' : 'si'}')" class="btn-nav" style="background:#111; color:#aaa; border-color:#555; width:100%; margin-top:10px; font-size:0.8em; padding:5px;">${isKnown ? '👁️ Ocultar Hechizo Globalmente' : '🙈 Hacer Público'}</button>` : '';

        html += `<div class="spell-card" style="border-top-color: ${col.b};">
                    <h3 style="color:${isHidden ? '#666' : col.t}">${titulo}</h3>
                    <div class="spell-tags">
                        <span class="spell-tag tag-hex">HEX: ${item["Hechizo Hex"] || info.HEX || 0}</span>
                        <span class="spell-tag" style="border-color:${col.b}; color:${col.t};">${item["Hechizo Afinidad"] || info.Afinidad}</span>
                        <span class="spell-tag tag-clase">${clase}</span>
                    </div>
                    ${res ? `<div class="spell-desc" style="${isHidden ? 'background:#000; border-left-color:#333;' : ''}">${res}</div>` : ''}
                    ${efe ? `<div class="spell-efecto">Efecto: <span style="color:var(--cyan-magic); font-weight:normal;">${efe}</span></div>` : ''}
                    ${detailsHTML}
                    <div class="tag-origen">Origen: ${item.Origen || 'Desconocido'}${isTemporal}</div>
                    ${btnVis}
                 </div>`;
    });
    document.getElementById('grid-grimorio').innerHTML = html || `<p style="grid-column:1/-1; color:#aaa; text-align:center;">El grimorio está vacío.</p>`;
}

export function dibujarGestionGrid() {
    const pj = estadoUI.personajeSeleccionado;
    const invNombres = getInventarioCombinado(pj).map(i => textNorm(i.Hechizo));
    let nodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    const fAf = estadoUI.filtrosGestion.afinidad; const fCl = estadoUI.filtrosGestion.clase; const fTx = estadoUI.filtrosGestion.busqueda.toLowerCase();
    
    if (fAf !== 'Todos') nodos = nodos.filter(n => n.Afinidad === fAf);
    if (fCl !== 'Todos') nodos = nodos.filter(n => n.Clase && n.Clase.includes(fCl));
    if (fTx) nodos = nodos.filter(n => n.Nombre.toLowerCase().includes(fTx));
    
    let html = ``;
    nodos.sort((a,b) => a.Nombre.localeCompare(b.Nombre)).forEach(h => {
        const isOwned = invNombres.includes(textNorm(h.Nombre)) || invNombres.includes(textNorm(h.ID));
        const isPublic = h.Conocido && h.Conocido.toString().trim().toLowerCase() === 'si';
        
        const checkColaVis = estadoUI.colaCambios.toggleConocido.slice().reverse().find(c => c.Hechizo === h.Nombre);
        const currentlyPublic = checkColaVis ? (checkColaVis.Estado === 'si') : isPublic;

        const col = getColorAfinidad(h.Afinidad); const costo = parseInt(h.HEX) || 0;
        
        const btn = isOwned 
            ? `<button onclick="window.accionCola('quitar', '${h.Nombre}')" class="btn-nav" style="background:#4a0000; border-color:#ff0000; color:white; width:100%; margin-top:10px;">❌ QUITAR HECHIZO</button>`
            : `<button onclick="window.accionCola('agregar', '${h.Nombre}', '${h.Afinidad}', ${costo})" class="btn-nav" style="background:#004a00; border-color:#00ff00; color:white; width:100%; margin-top:10px;">➕ ASIGNAR</button>`;

        const btnVis = `<button onclick="window.accionCola('toggle_conocido', '${h.Nombre}', '', 0, '${currentlyPublic ? 'no' : 'si'}')" class="btn-nav" style="background:#111; color:#aaa; border-color:#555; width:100%; margin-top:5px; font-size:0.8em; padding:5px;">${currentlyPublic ? '👁️ Ocultar Hechizo' : '🙈 Hacer Público'}</button>`;

        html += `<div class="spell-card" style="border-left:4px solid ${col.b}; ${isOwned ? 'box-shadow: inset 0 0 15px rgba(0,255,0,0.1);' : ''}">
                    <h3 style="color:${col.t}; margin-bottom:2px;">${h.Nombre}</h3>
                    <span style="display:block; color:#888; font-size:0.7em; font-style:italic; margin-bottom:10px;">ID: ${h.ID}</span>
                    <div class="spell-tags">
                        <span class="spell-tag tag-hex">HEX: ${costo}</span>
                        <span class="spell-tag tag-clase">${h.Clase || '-'}</span>
                    </div>
                    ${btn}
                    ${btnVis}
                 </div>`;
    });
    document.getElementById('grid-gestion').innerHTML = html;
}

export function dibujarAprendizajeGrid() {
    const pj = estadoUI.personajeSeleccionado; 
    const grupos = obtenerHechizosAprendibles(pj);
    let html = ``;
    
    if(Object.keys(grupos).length === 0) {
        document.getElementById('grid-aprendizaje').innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#ff4444; font-size:1.2em;">No hay hechizos que cumplan con los precedentes actuales.</p>`;
        return;
    }

    Object.keys(grupos).forEach(reqStr => {
        html += `<h3 class="req-header">PRECEDENTES: <span style="color:#ccc;">${reqStr}</span></h3><div class="grid-inventario">`;
        
        grupos[reqStr].forEach(h => {
            const col = getColorAfinidad(h.Afinidad); const costo = parseInt(h.HEX) || 0;
            
            const isPublicBase = h.Conocido && h.Conocido.toString().trim().toLowerCase() === 'si';
            const checkColaVis = estadoUI.colaCambios.toggleConocido.slice().reverse().find(c => c.Hechizo === h.Nombre);
            const isKnown = checkColaVis ? (checkColaVis.Estado === 'si') : isPublicBase;
            
            const titulo = isKnown ? h.Nombre : h.ID;
            const res = isKnown ? getValInfo(h, ['resumen', 'Resumen']) : '<i style="color:#ff4444;">Información Sellada (Hechizo no descubierto).</i>';
            const efe = isKnown ? getValInfo(h, ['efecto', 'Efecto']) : '';
            const details = isKnown ? generarDetalles(h) : '';

            html += `<div class="spell-card" style="border: 2px dashed ${col.b}; background:rgba(10,20,30,0.5);">
                        <h3 style="color:${isKnown ? col.t : '#666'};">${titulo}</h3>
                        <div class="spell-tags">
                            <span class="spell-tag tag-hex">COSTE: ${costo}</span>
                            <span class="spell-tag" style="border-color:${col.b}; color:${col.t};">${h.Afinidad}</span>
                            <span class="spell-tag tag-clase">${h.Clase || '-'}</span>
                        </div>
                        <div class="spell-desc" style="${!isKnown ? 'background:#000; border-left-color:#333;' : ''}">${res}</div>
                        ${efe ? `<div class="spell-efecto">Efecto: <span style="color:var(--cyan-magic); font-weight:normal;">${efe}</span></div>` : ''}
                        ${details}
                     </div>`;
        });
        html += `</div>`;
    });
    document.getElementById('grid-aprendizaje').innerHTML = html;
}
