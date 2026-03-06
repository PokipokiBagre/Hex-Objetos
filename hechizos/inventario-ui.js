import { db, estadoUI } from './inventario-state.js';
import { getInventarioCombinado, obtenerHechizosAprendibles, filtrarHechizosGestion } from './inventario-logic.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');

function getColorAfinidad(af) {
    if(af === 'Física') return { b: '#8b4513', t: '#e2a673' };
    if(af === 'Energética') return { b: '#e67e22', t: '#f3b67a' };
    if(af === 'Espiritual') return { b: '#2ecc71', t: '#7df0a7' };
    if(af === 'Mando') return { b: '#3498db', t: '#a4d3f2' };
    if(af === 'Psíquica') return { b: '#9b59b6', t: '#dcb1f0' };
    if(af === 'Oscura') return { b: 'var(--purple-magic)', t: '#c285ff' };
    return { b: '#555', t: '#fff' };
}

export function dibujarCatalogo() {
    const contenedor = document.getElementById('vista-catalogo');
    let html = `<div class="catalogo-grid">`;
    
    Object.keys(db.personajes).sort().forEach(nombre => {
        const p = db.personajes[nombre];
        if (estadoUI.filtroRol === 'Jugador' && !p.isPlayer) return; 
        if (estadoUI.filtroRol === 'NPC' && p.isPlayer) return;
        if (estadoUI.filtroAct === 'Activo' && !p.isActive) return; 
        if (estadoUI.filtroAct === 'Inactivo' && p.isActive) return;

        const img = normalizar(p.iconoOverride);
        const style = p.isPlayer && p.isActive ? 'border: 2px solid var(--gold); background: rgba(30,5,50,0.8);' : 'border: 1px solid #555; background: rgba(10,10,10,0.8);';
        const opacity = p.isActive ? '1' : '0.4; filter: grayscale(1);';

        html += `<div class="char-card" style="${style} opacity:${opacity}; text-align:center;" onclick="window.abrirGrimorio('${nombre}')">
                    <img src="../img/imgpersonajes/${img}icon.png" style="width:90px;height:90px;border-radius:50%;border:2px solid var(--gold);object-fit:cover;" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                    <h3 style="margin:10px 0 5px 0;">${nombre}</h3>
                 </div>`;
    });
    contenedor.innerHTML = html + `</div>`;
}

export function dibujarGrimorio() {
    const pj = estadoUI.personajeSeleccionado;
    const inv = getInventarioCombinado(pj);
    const todosLosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    
    let html = `<div class="player-header" style="justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:20px;">
                        <img src="../img/imgpersonajes/${normalizar(db.personajes[pj].iconoOverride)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                        <h2>Grimorio de ${pj.toUpperCase()}</h2>
                    </div>
                    ${estadoUI.esAdmin ? `
                    <div style="display:flex; gap:10px;">
                        <button onclick="window.cambiarVista('aprendizaje')" style="background:#004a4a; border-color:#00ffff;">Árbol de Aprendizaje</button>
                        <button onclick="window.cambiarVista('gestion')" style="background:#4a004a; border-color:#ff00ff;">Asignar/Quitar Hechizos</button>
                    </div>` : ''}
                </div>
                <div class="grid-inventario">`;

    if(inv.length === 0) html += `<p style="grid-column:1/-1; text-align:center; color:#aaa;">No posee hechizos.</p>`;

    inv.forEach(item => {
        const info = todosLosNodos.find(n => n.Nombre === item.Hechizo) || {};
        const colors = getColorAfinidad(item["Hechizo Afinidad"] || info.Afinidad);
        const enCola = estadoUI.colaCambios.agregar.some(c => c.Hechizo === item.Hechizo) ? '<span style="color:var(--gold); font-size:0.6em;">[PENDIENTE]</span>' : '';
        
        html += `<div class="spell-card" style="border-top: 3px solid ${colors.b};">
                    <h3 style="color:${colors.t}">${item.Hechizo} ${enCola}</h3>
                    <div class="spell-tags">
                        <span class="spell-tag tag-hex">HEX: ${item["Hechizo Hex"] || info.HEX || 0}</span>
                        <span class="spell-tag" style="color:${colors.t}; border-color:${colors.b};">${item["Hechizo Afinidad"] || info.Afinidad}</span>
                        <span class="spell-tag tag-tipo">${item.Tipo || 'Normal'}</span>
                    </div>
                    ${info.resumen && info.resumen !== 'Desconocido' ? `<div class="spell-desc">${info.resumen}</div>` : ''}
                    ${info.efecto && info.efecto !== 'Desconocido' ? `<div class="spell-efecto">Efecto: ${info.efecto}</div>` : ''}
                 </div>`;
    });
    document.getElementById('vista-grimorio').innerHTML = html + `</div>`;
}

export function dibujarGestion() {
    const pj = estadoUI.personajeSeleccionado;
    const invNombres = getInventarioCombinado(pj).map(i => i.Hechizo);
    const hechizos = filtrarHechizosGestion();

    let html = `<div class="player-header"><h2>Gestión OP: ${pj}</h2></div>
                <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px;">
                    <select id="filtro-afinidad" onchange="window.aplicarFiltroGestion()"><option value="Todos">Todas Afinidades</option><option>Física</option><option>Energética</option><option>Espiritual</option><option>Mando</option><option>Psíquica</option><option>Oscura</option></select>
                    <select id="filtro-clase" onchange="window.aplicarFiltroGestion()"><option value="Todos">Todas Clases</option><option value="Clase 1">Clase 1</option><option value="Clase 2">Clase 2</option><option value="Clase 3">Clase 3</option></select>
                    <input type="text" id="filtro-texto" placeholder="Buscar hechizo..." onkeyup="window.aplicarFiltroGestion()" style="background:#111; color:var(--gold); border:1px solid var(--gold); padding:10px; border-radius:4px;">
                </div>
                <div class="grid-inventario" style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));">`;

    hechizos.forEach(h => {
        const loTiene = invNombres.includes(h.Nombre);
        const colores = getColorAfinidad(h.Afinidad);
        const btnAccion = loTiene 
            ? `<button onclick="window.accionCola('quitar', '${h.Nombre}')" style="background:#4a0000; color:white; border-color:#ff0000; width:100%; margin-top:10px;">QUITAR</button>`
            : `<button onclick="window.accionCola('agregar', '${h.Nombre}', '${h.Afinidad}', ${h.HEX})" style="background:#004a00; color:white; border-color:#00ff00; width:100%; margin-top:10px;">ASIGNAR</button>`;

        html += `<div class="spell-card" style="border-left:4px solid ${colores.b}; ${loTiene ? 'box-shadow: inset 0 0 15px rgba(0,255,0,0.2);' : ''}">
                    <h3 style="color:${colores.t}; font-size:1.1em;">${h.Nombre}</h3>
                    <div class="spell-tags"><span class="spell-tag tag-hex">HEX: ${h.HEX}</span></div>
                    ${btnAccion}
                 </div>`;
    });
    document.getElementById('vista-gestion').innerHTML = html + `</div>`;
}

export function dibujarAprendizaje() {
    const pj = estadoUI.personajeSeleccionado;
    const aprendibles = obtenerHechizosAprendibles(pj);

    let html = `<div class="player-header"><h2>Árbol de Aprendizaje (Desbloqueados): ${pj}</h2></div>
                <p style="text-align:center; color:#aaa; margin-bottom:20px;">Estos hechizos tienen todos sus requisitos (Sources) cumplidos en el inventario actual.</p>
                <div class="grid-inventario">`;

    if(aprendibles.length === 0) html += `<p style="grid-column:1/-1; text-align:center; color:#ff4444;">No hay hechizos nuevos disponibles para aprender según las ramas del árbol.</p>`;

    aprendibles.forEach(h => {
        const colores = getColorAfinidad(h.Afinidad);
        html += `<div class="spell-card" style="border: 2px dashed ${colores.b}; background:rgba(0,30,0,0.6);">
                    <h3 style="color:${colores.t};">${h.Nombre}</h3>
                    <div class="spell-tags"><span class="spell-tag tag-hex">HEX: ${h.HEX}</span><span class="spell-tag">${h.Afinidad}</span></div>
                    ${h.resumen && h.resumen !== 'Desconocido' ? `<div class="spell-desc">${h.resumen}</div>` : ''}
                    <button onclick="window.accionCola('agregar', '${h.Nombre}', '${h.Afinidad}', ${h.HEX}); window.cambiarVista('grimorio');" style="background:#004a4a; width:100%; margin-top:15px;">Aprender Hechizo</button>
                 </div>`;
    });
    document.getElementById('vista-aprendizaje').innerHTML = html + `</div>`;
}
