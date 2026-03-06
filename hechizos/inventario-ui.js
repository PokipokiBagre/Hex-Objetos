import { db, estadoUI } from './inventario-state.js';
import { getInventarioCombinado, obtenerHechizosAprendibles } from './inventario-logic.js';

const normalizar = (str) => str ? str.toString().trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') : '';

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

// Extractor tolerante a mayúsculas para las columnas F a J
function getVal(info, key1, key2) {
    const val = info[key1] || info[key2] || null;
    if (!val || val === '0' || val === 0 || val === 'Desconocido' || val === 'null') return null;
    return val;
}

function generarDetalles(info) {
    const ov = getVal(info, 'overcast 100%', 'Overcast 100%');
    const un = getVal(info, 'undercast 50%', 'Undercast 50%');
    const es = getVal(info, 'especial', 'Especial');
    
    if (!ov && !un && !es) return '';
    return `
    <details class="spell-details">
        <summary>Ver Detalles</summary>
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

        const style = p.isPlayer ? 'player-card' : '';
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
    
    document.getElementById('header-grimorio').innerHTML = `
        <button onclick="window.cambiarVista('catalogo')" class="btn-nav btn-volver" style="margin-bottom:20px;">⬅ Volver al Catálogo</button>
        <div class="player-header">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="../img/imgpersonajes/${normalizar(char.iconoOverride)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                <div><h2 style="margin:0;">${pj.toUpperCase()}</h2><p style="margin:5px 0 0 0; color:var(--gold);">HEX Disponible: <strong>${char.hex}</strong></p></div>
            </div>
            <div style="display:flex; gap:10px;">
                <button onclick="window.cambiarVista('aprendizaje')" class="btn-nav" style="background:#004a4a; border-color:var(--cyan-magic);">✨ Árbol de Aprendizaje</button>
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

    document.getElementById('header-gestion').innerHTML = `
        <button onclick="window.cambiarVista('grimorio')" class="btn-nav btn-volver" style="margin-bottom:20px;">⬅ Volver al Grimorio</button>
        <div class="player-header">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="../img/imgpersonajes/${normalizar(char.iconoOverride)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                <div><h2 style="margin:0;">GESTIÓN OP: ${pj.toUpperCase()}</h2><p style="margin:5px 0 0 0; color:var(--gold);">HEX Actual: <strong>${char.hex}</strong></p></div>
            </div>
            <button onclick="window.descargarCSVHex()" class="btn-nav" style="background:#8b0000; color:white;">📥 DESCARGAR CSV (Afinidades y HEX)</button>
        </div>
        <label class="toggle-hex">
            <input type="checkbox" onchange="window.toggleRestarHex(this.checked)" ${estadoUI.restarHexAsignacion ? 'checked' : ''}>
            RESTAR HEX Y SUBIR AFINIDAD (+1) AL ASIGNAR HECHIZO
        </label>
        <div style="margin-bottom:20px; text-align:center;">
            <label style="color:var(--gold); font-weight:bold; margin-right:10px;">Fuente del Hechizo (Origen):</label>
            <select id="slicer-origen" class="search-bar" style="margin:0; width:auto;">
                <option value="Mapa Hex">Mapa Hex</option>
                <option value="OP Admin">OP Admin</option>
                ${Object.keys(db.personajes).sort().map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
        </div>`;
}

export function dibujarGrimorioGrid() {
    const pj = estadoUI.personajeSeleccionado; const inv = getInventarioCombinado(pj);
    const todosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    const fAf = estadoUI.filtrosGrimorio.afinidad; const fTx = estadoUI.filtrosGrimorio.busqueda.toLowerCase();
    
    let html = ``;
    inv.filter(item => (fAf === 'Todos' || item["Hechizo Afinidad"] === fAf) && (!fTx || item.Hechizo.toLowerCase().includes(fTx)))
       .forEach(item => {
        const info = todosNodos.find(n => n.Nombre.trim().toLowerCase() === item.Hechizo.trim().toLowerCase()) || {};
        const col = getColorAfinidad(item["Hechizo Afinidad"] || info.Afinidad);
        const res = getVal(info, 'resumen', 'Resumen');
        const efe = getVal(info, 'efecto', 'Efecto');
        const clase = info.Clase || 'Clase -';
        const isTemporal = item.Tipo && item.Tipo !== 'Normal' ? `<br><i>Hechizo ${item.Tipo}</i>` : '';

        html += `<div class="spell-card" style="border-top-color: ${col.b};">
                    <h3 style="color:${col.t}">${item.Hechizo}</h3>
                    <div class="spell-tags">
                        <span class="spell-tag tag-hex">HEX: ${item["Hechizo Hex"] || info.HEX || 0}</span>
                        <span class="spell-tag" style="border-color:${col.b}; color:${col.t};">${item["Hechizo Afinidad"] || info.Afinidad}</span>
                        <span class="spell-tag tag-clase">${clase}</span>
                    </div>
                    ${res ? `<div class="spell-desc">${res}</div>` : ''}
                    ${efe ? `<div class="spell-efecto">Efecto: <span style="color:var(--cyan-magic); font-weight:normal;">${efe}</span></div>` : ''}
                    ${generarDetalles(info)}
                    <div class="tag-origen">Origen: ${item.Origen || 'Desconocido'}${isTemporal}</div>
                 </div>`;
    });
    document.getElementById('grid-grimorio').innerHTML = html || `<p style="grid-column:1/-1; color:#aaa; text-align:center;">Vacio.</p>`;
}

export function dibujarGestionGrid() {
    const pj = estadoUI.personajeSeleccionado;
    const invNombres = getInventarioCombinado(pj).map(i => i.Hechizo.toLowerCase().trim());
    let nodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    const fAf = estadoUI.filtrosGestion.afinidad; const fCl = estadoUI.filtrosGestion.clase; const fTx = estadoUI.filtrosGestion.busqueda.toLowerCase();
    
    if (fAf !== 'Todos') nodos = nodos.filter(n => n.Afinidad === fAf);
    if (fCl !== 'Todos') nodos = nodos.filter(n => n.Clase && n.Clase.includes(fCl));
    if (fTx) nodos = nodos.filter(n => n.Nombre.toLowerCase().includes(fTx));
    
    let html = ``;
    nodos.sort((a,b) => a.Nombre.localeCompare(b.Nombre)).forEach(h => {
        const isOwned = invNombres.includes(h.Nombre.toLowerCase().trim());
        const col = getColorAfinidad(h.Afinidad); const costo = parseInt(h.HEX) || 0;
        
        const btn = isOwned 
            ? `<button onclick="window.accionCola('quitar', '${h.Nombre}')" class="btn-nav" style="background:#4a0000; border-color:#ff0000; color:white; width:100%; margin-top:10px;">❌ QUITAR</button>`
            : `<button onclick="window.accionCola('agregar', '${h.Nombre}', '${h.Afinidad}', ${costo})" class="btn-nav" style="background:#004a00; border-color:#00ff00; color:white; width:100%; margin-top:10px;">➕ ASIGNAR</button>`;

        html += `<div class="spell-card" style="border-left:4px solid ${col.b}; ${isOwned ? 'box-shadow: inset 0 0 15px rgba(0,255,0,0.1);' : ''}">
                    <h3 style="color:${col.t}; font-size:1.1em;">${h.Nombre}</h3>
                    <div class="spell-tags"><span class="spell-tag tag-hex">HEX: ${costo}</span><span class="spell-tag tag-clase">${h.Clase || '-'}</span></div>
                    ${btn}
                 </div>`;
    });
    document.getElementById('grid-gestion').innerHTML = html;
}

export function dibujarAprendizajeGrid() {
    const pj = estadoUI.personajeSeleccionado; 
    const grupos = obtenerHechizosAprendibles(pj);
    let html = ``;
    
    if(Object.keys(grupos).length === 0) {
        document.getElementById('grid-aprendizaje').innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#ff4444; font-size:1.2em;">No hay ramas disponibles.</p>`;
        return;
    }

    Object.keys(grupos).forEach(reqStr => {
        html += `<h3 class="req-header">Requiere: ${reqStr.toUpperCase()}</h3><div class="grid-inventario">`;
        
        grupos[reqStr].forEach(h => {
            const col = getColorAfinidad(h.Afinidad); const costo = parseInt(h.HEX) || 0;
            const isKnown = h.Conocido && h.Conocido.toString().trim().toLowerCase() === 'si';
            
            // LÓGICA DE ENMASCARAMIENTO PARA HECHIZOS OCULTOS
            const titulo = isKnown ? h.Nombre : h.ID;
            const res = isKnown ? getVal(h, 'resumen', 'Resumen') : 'Info. Bloqueada (Hechizo Oculto)';
            const efe = isKnown ? getVal(h, 'efecto', 'Efecto') : '';
            const details = isKnown ? generarDetalles(h) : '';

            html += `<div class="spell-card" style="border: 2px dashed ${col.b}; background:rgba(10,20,30,0.5);">
                        <h3 style="color:${col.t};">${titulo}</h3>
                        <div class="spell-tags">
                            <span class="spell-tag tag-hex">Coste: ${costo}</span>
                            <span class="spell-tag" style="border-color:${col.b}; color:${col.t};">${h.Afinidad}</span>
                        </div>
                        <div class="spell-desc">${res}</div>
                        ${efe ? `<div class="spell-efecto">Efecto: <span style="color:var(--cyan-magic); font-weight:normal;">${efe}</span></div>` : ''}
                        ${details}
                     </div>`;
        });
        html += `</div>`;
    });
    document.getElementById('grid-aprendizaje').innerHTML = html;
}
