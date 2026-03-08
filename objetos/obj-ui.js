import { invGlobal, objGlobal, estadoUI } from './obj-state.js';

function drawnHEXPreserveFocus(containerId, html) {
    const activeId = document.activeElement ? document.activeElement.id : null;
    const start = document.activeElement ? document.activeElement.selectionStart : null;
    const end = document.activeElement ? document.activeElement.selectionEnd : null;
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = html;
        if (activeId && document.getElementById(activeId)) {
            const el = document.getElementById(activeId);
            el.focus(); if (el.setSelectionRange) el.setSelectionRange(start, end);
        }
    }
}

export function refrescarUI() { 
    // CONGELADOR DE ORDEN GENERAL (Se activa al cambiar de pestaña)
    if (estadoUI.resetCacheOrder) {
        estadoUI.cachedSortKeys = Object.keys(objGlobal).sort((a, b) => (invGlobal[estadoUI.jugadorInv]?.[b]||0) - (invGlobal[estadoUI.jugadorInv]?.[a]||0) || a.localeCompare(b));
        estadoUI.cachedInvOrders = {};
        Object.keys(invGlobal).forEach(j => {
            estadoUI.cachedInvOrders[j] = Object.keys(invGlobal[j]).filter(o => invGlobal[j][o] > 0).sort();
        });
        estadoUI.resetCacheOrder = false;
    }

    if (estadoUI.vistaActual === 'grilla') dibujarGrillaPersonajes();
    else if (estadoUI.vistaActual === 'inventario') dibujarInventarios();
    else if (estadoUI.vistaActual === 'resumen') dibujarResumenVisual();
    else if (estadoUI.vistaActual === 'catalogo') dibujarCatalogo(); 
    else if (estadoUI.vistaActual === 'control') dibujarControl();
    else if (estadoUI.vistaActual === 'op-menu') dibujarMenuOP();
    else if (estadoUI.vistaActual === 'crear') dibujarCreacionObjeto();
    else if (estadoUI.vistaActual === 'crear-multi') dibujarCreacionMulti();
    else if (estadoUI.vistaActual === 'party-loot') dibujarPartyLoot();
    else if (estadoUI.vistaActual === 'transfer') dibujarTransferencia();
}

const raridadValor = { "Legendario": 3, "Raro": 2, "Común": 1, "-": 0 };
const normalizarNombre = (str) => str ? str.toString().trim().toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/\s+/g,'_').replace(/[^a-z0-9ñ_]/g,'') : "";

export function dibujarGrillaPersonajes() {
    let html = `<h2 style="margin-top:0;">Inventarios</h2><div class="catalogo-grid">`;
    Object.keys(invGlobal).sort().forEach(j => {
        let countComun = 0, countRaro = 0, countLeg = 0;
        Object.keys(invGlobal[j]).forEach(o => {
            if (invGlobal[j][o] > 0) {
                const rar = objGlobal[o]?.rar;
                if (rar === 'Legendario') countLeg += invGlobal[j][o];
                else if (rar === 'Raro') countRaro += invGlobal[j][o];
                else countComun += invGlobal[j][o];
            }
        });
        html += `
        <div class="char-card player-card" onclick="window.abrirInventario('${j}')">
            <img src="../img/imgpersonajes/${normalizarNombre(j)}icon.png" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
            <h3>${j}</h3>
            <p>Comunes: <b style="color:white">${countComun}</b></p>
            <p>Raros: <b style="color:#8a2be2">${countRaro}</b> | Legendarios: <b style="color:var(--gold)">${countLeg}</b></p>
        </div>`;
    });
    html += `</div>`;
    drawnHEXPreserveFocus('contenedor-grilla', html);
}

export function dibujarResumenVisual() {
    let html = `<h2 style="margin-top:0;">Resumen del Equipo del Grupo</h2>`;
    
    Object.keys(invGlobal).sort().forEach(j => {
        let itemsHtml = '';
        
        // Usamos el caché de orden. Añadimos objetos nuevos si recibieron stock en esta vista.
        let frozenKeys = estadoUI.cachedInvOrders[j] || [];
        Object.keys(invGlobal[j]).forEach(k => { if (invGlobal[j][k] > 0 && !frozenKeys.includes(k)) frozenKeys.push(k); });

        frozenKeys.forEach(o => {
            const count = invGlobal[j][o];
            if (count > 0) {
                const info = objGlobal[o] || {};
                const imgFile = normalizarNombre(o);
                const tooltipText = `<span>${o}</span>Tipo: ${info.tipo}<br>Rareza: ${info.rar}<br><br>${info.eff}`;
                
                // Botones +/- en modo OP
                let badgeHTML = '';
                if(estadoUI.esAdmin) {
                    badgeHTML = `
                    <div class="badge-op">
                        <button class="minus" onclick="window.hexMod('${j}','${o}',-1); event.stopPropagation();">-</button>
                        <span>${count}</span>
                        <button class="plus" onclick="window.hexMod('${j}','${o}',1); event.stopPropagation();">+</button>
                    </div>`;
                } else {
                    badgeHTML = `<div class="badge-normal">${count}</div>`;
                }

                itemsHtml += `
                <div class="hex-tooltip img-stack" onclick="window.verImagen('../img/imgobjetos/${imgFile}.png')">
                    <img src="../img/imgobjetos/${imgFile}.png" onerror="this.src='../img/imgobjetos/no_encontrado.png'" alt="${o}">
                    ${badgeHTML}
                    <div class="tooltiptext">${tooltipText}</div>
                </div>`;
            }
        });

        if(itemsHtml !== '') {
            html += `
            <div class="resumen-row">
                <div class="resumen-left">
                    <img src="../img/imgpersonajes/${normalizarNombre(j)}icon.png" onerror="this.src='../img/imgobjetos/no_encontrado.png'" style="width:75px; height:75px; border-radius:50%; border:2px solid var(--gold); object-fit:cover;">
                    <h3 style="margin:8px 0 0 0; font-size:1em; color:var(--gold);">${j.toUpperCase()}</h3>
                </div>
                <div class="resumen-right">
                    ${itemsHtml}
                </div>
            </div>`;
        }
    });
    
    drawnHEXPreserveFocus('contenedor-resumen', html || '<p style="text-align:center; color:#aaa;">Nadie tiene objetos todavía.</p>');
}

export function dibujarInventarios() {
    if (!estadoUI.jugadorInv) return;
    const j = estadoUI.jugadorInv;
    const term = (estadoUI.busquedaInv || "").toLowerCase();
    
    // Enlace mágico hacia la página de Estadísticas del jugador
    const linkStats = `../stats/index.html?pj=${encodeURIComponent(j)}`;
    
    let html = `
    <button onclick="window.volverAGrilla()" style="background:#444; margin-bottom: 20px;">⬅ Volver a Inventarios</button>
    <div class="player-header">
        <a href="${linkStats}" target="_blank" title="Ver ficha de estado de ${j}">
            <img src="../img/imgpersonajes/${normalizarNombre(j)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
        </a>
        <div style="text-align:left; flex:1;">
            <a href="${linkStats}" target="_blank" style="text-decoration:none;" title="Ver ficha de estado de ${j}">
                <h1 style="margin: 0; color:var(--gold);">${j.toUpperCase()}</h1>
            </a>
        </div>
        ${estadoUI.esAdmin ? `<button onclick="window.mostrarPagina('control')" style="background:#4a004a; border-color:var(--gold);">⚙️ Panel Control Masivo</button>` : ''}
    </div>
    <input type="text" id="busq-inv" class="search-bar" placeholder="🔍 Filtrar equipo..." value="${estadoUI.busquedaInv}" oninput="window.setBusquedaInv(this.value)">`;

    html += `<div class="table-responsive"><table><tr><th>Imagen</th><th>Objeto</th><th>Efecto</th><th>Cant</th></tr>`;
    frozenKeys.forEach(o => {
        if (invGlobal[j][o] > 0 && (!term || o.toLowerCase().includes(term))) {
            
            // Si es OP, renderiza botones + y - al lado de la cantidad
            const cantHTML = estadoUI.esAdmin 
                ? `<div style="display:flex; justify-content:center; align-items:center; gap:8px;">
                     <button class="btn-inline-op minus" onclick="window.hexMod('${j}','${o}',-1)">-</button>
                     <b style="font-size:1.3em; width:20px;">${invGlobal[j][o]}</b>
                     <button class="btn-inline-op plus" onclick="window.hexMod('${j}','${o}',1)">+</button>
                   </div>`
                : `<b style="font-size:1.2em">${invGlobal[j][o]}</b>`;

            html += `<tr>
                <td><img src="../img/imgobjetos/${normalizarNombre(o)}.png" class="cat-img" onclick="window.verImagen(this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'"></td>
                <td style="font-weight:bold; color:#d4af37; cursor:pointer;" onclick="window.verImagenByName('${o}')">${o}</td>
                <td style="text-align:left; font-size:0.85em;">${objGlobal[o]?.eff}</td>
                <td>${cantHTML}</td>
            </tr>`;
        }
    });
    html += "</table></div>";
    drawnHEXPreserveFocus('contenedor-jugadores', html);
}

export function dibujarCatalogo() {
    let html = "<h2>Catálogo Completo</h2><div class='filter-group'>";
    ['Todos', 'Común', 'Raro', 'Legendario'].forEach(r => {
        const active = estadoUI.filtroRar === r ? 'class="btn-active"' : '';
        html += `<button onclick="window.setRar('${r}')" ${active}>${r}</button> `;
    });
    html += "</div><div class='filter-group'>";
    ['Todos', 'Orgánico', 'Cristal', 'Metal', 'Sagrado'].forEach(m => {
        const active = estadoUI.filtroMat === m ? 'class="btn-active-mat"' : '';
        html += `<button onclick="window.setMat('${m}')" ${active}>${m}</button> `;
    });
    html += `</div><br><input type="text" id="busq-cat" class="search-bar" placeholder="🔍 Buscar objeto..." value="${estadoUI.busquedaCat}" oninput="window.setBusquedaCat(this.value)">
    <div class="table-responsive"><table><tr><th>Imagen</th><th>Nombre</th><th>Tipo</th><th>Efecto</th><th>Rareza</th></tr>`;
    
    const term = (estadoUI.busquedaCat || "").toLowerCase();
    Object.keys(objGlobal).sort().forEach(o => {
        const item = objGlobal[o];
        const matchR = estadoUI.filtroRar === 'Todos' || item.rar.trim() === estadoUI.filtroRar;
        const matchM = estadoUI.filtroMat === 'Todos' || item.mat.trim() === estadoUI.filtroMat;
        
        if (matchR && matchM && (!term || o.toLowerCase().includes(term))) {
            html += `<tr>
                <td><img src="../img/imgobjetos/${normalizarNombre(o)}.png" class="cat-img" onclick="window.verImagen(this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'"></td>
                <td style="font-weight:bold; color:#d4af37; cursor:pointer;" onclick="window.verImagenByName('${o}')">${o}</td>
                <td style="font-size:0.85em; color:#aaa;">${item.tipo}</td>
                <td style="text-align:left; font-size:0.85em;">${item.eff}</td>
                <td style="font-size:0.85em;">${item.rar}</td>
            </tr>`;
        }
    });
    drawnHEXPreserveFocus('tabla-todos-objetos', html + "</table></div>");
}

export function dibujarMenuOP() {
    document.getElementById('menu-op-central').innerHTML = `
        <h2 style="margin-top:0;">Panel OP Maestro</h2>
        <div class="op-grid">
            <button onclick="window.mostrarPagina('party-loot')" style="background:#b8860b; color:#000;">Repartir Loot a Party</button>
            <button onclick="window.mostrarPagina('transfer')" style="background:#1a4b8c; color:#fff;">Mercado de Transferencias</button>
            <button onclick="window.mostrarPagina('crear')" style="background:#4a004a">Creación Rápida (1)</button>
            <button onclick="window.mostrarPagina('crear-multi')" style="background:#600060">Forja Múltiple (5)</button>
            <button onclick="window.descargarInventariosJPG()" style="background:#8b0000">Descargar todos los JPGs</button>
            <button onclick="window.descargarLogExcel()" style="background:#107c41; color:#fff;">Descargar Log (Excel)</button>
            <button onclick="window.descargarEstadoExcel()" style="background:#107c41; color:#fff;">Descargar Stock (Excel)</button>
        </div>`;
}

export function dibujarControl() {
    if (!estadoUI.jugadorInv) return; const j = estadoUI.jugadorInv; 
    
    // Añadimos al caché visual cualquier objeto nuevo que haya recibido stock en esta sesión
    let currentKeys = estadoUI.cachedInvOrders[j] || [];
    Object.keys(invGlobal[j]).forEach(k => {
         if (invGlobal[j][k] > 0 && !currentKeys.includes(k)) currentKeys.push(k);
    });

    let html = `<h2>Edición In-Situ: ${j}</h2><button onclick="window.mostrarPagina('inventario')" style="background:#444; margin-bottom: 20px;">⬅ Volver al Inventario</button>`;
    
    html += `<h3 style="color:var(--gold); margin-top:10px;">Inventario Actual (Click para modificar)</h3>
             <div style="background:#0a0014; padding:15px; border:1px solid var(--gold); border-radius:8px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">`;
    
    let hasItems = false;
    const actionColor = estadoUI.editModo === 1 ? '#00ff00' : '#ff0000';
    
    currentKeys.forEach(o => {
        if (invGlobal[j][o] > 0) {
            html += `<button onclick="window.hexMod('${j}','${o}', ${estadoUI.editMult * estadoUI.editModo})" 
                             style="background:#222; padding:5px 12px; border-radius:4px; border:1px solid #444; font-size:0.9em; box-shadow:0 2px 4px #000; cursor:pointer; transition:0.2s;" 
                             onmouseover="this.style.borderColor='${actionColor}'" onmouseout="this.style.borderColor='#444'" title="Haz clic para modificar">
                        ${o}: <b style="color:var(--gold); font-size:1.3em; margin-left:5px;">${invGlobal[j][o]}</b>
                     </button>`;
            hasItems = true;
        }
    });
    if(!hasItems) html += `<span style="color:#666;">El inventario está vacío.</span>`;
    html += `</div>`;

    html += `<div class="container-hex" style="margin-bottom:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
                <textarea id="copy-log-stock" class="search-bar" readonly style="width:95%; height:80px; font-size:0.85em; margin-bottom:10px;">${estadoUI.logCopy || 'Bitácora de sesión...'}</textarea>
                <div style="display:flex; gap:10px;"><button onclick="window.copyToClipboard('copy-log-stock')" style="flex:3; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO TOTAL</button><button onclick="window.limpiarLog()" style="flex:1; background:#8b0000; color:white;">X</button></div>
             </div>
             
             <h3 style="color:var(--gold); margin-top:20px; border-bottom:1px solid #333; padding-bottom:10px;">Catálogo (Haz clic en la imagen)</h3>
             <div style="display:flex; justify-content:center; gap:10px; margin-bottom:10px; margin-top:15px;">
                <button onclick="window.setEditModo(1)" style="background:${estadoUI.editModo === 1 ? '#004a00' : '#222'}">MODO SUMAR (+)</button>
                <button onclick="window.setEditModo(-1)" style="background:${estadoUI.editModo === -1 ? '#660000' : '#222'}">MODO RESTAR (-)</button>
             </div>
             <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
                ${[1, 5, 10, 50, 100].map(m => `<button onclick="window.setEditMult(${m})" style="background:${estadoUI.editMult === m ? 'var(--gold)' : '#222'}; color:${estadoUI.editMult === m ? '#000' : '#fff'}">x${m}</button>`).join('')}
             </div>
             
             <input type="text" id="busq-op" class="search-bar" placeholder="🔍 Filtrar objeto y haz clic en la imagen..." value="${estadoUI.busquedaOP}" oninput="window.setBusquedaOP(this.value)">
             <div class="grid-control">`;
    
    estadoUI.cachedSortKeys.forEach(o => {
        const term = estadoUI.busquedaOP.toLowerCase();
        if (!term || o.toLowerCase().includes(term)) {
            const c = invGlobal[j][o] || 0;
            html += `<div class="control-card ${c > 0 ? "item-con-stock" : ""}">
                        <img src="../img/imgobjetos/${normalizarNombre(o)}.png" 
                             onclick="window.hexMod('${j}','${o}', ${estadoUI.editMult * estadoUI.editModo})" 
                             style="width:80px; height:80px; object-fit:cover; cursor:pointer; border-radius:8px; border:2px solid ${actionColor}; transition:0.2s; box-shadow:0 0 10px ${actionColor};"
                             onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
                             onerror="this.src='../img/imgobjetos/no_encontrado.png'" title="Click para aplicar">
                        <span class="item-name" style="margin-top:10px;">${o}</span>
                     </div>`;
        }
    });
    drawnHEXPreserveFocus('panel-interactivo', html + "</div>");
}

export function dibujarPartyLoot() {
    const term = (estadoUI.busquedaOP || "").toLowerCase();

    let html = `<h2>Loot Rápido para la Party</h2>
                <button onclick="window.mostrarPagina('op-menu')" style="background:#444; margin-bottom: 20px;">⬅ Volver al Panel OP</button>
                <div style="background:#1a0033; padding:15px; border-radius:8px; border:1px dashed var(--gold); margin-bottom:20px;">
                    <h4 style="color:var(--gold); margin-top:0;">1. Selecciona los destinatarios</h4>
                    <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">`;
    
    Object.keys(invGlobal).sort().forEach(j => {
        const isChecked = estadoUI.partyLoot.includes(j) ? 'checked' : '';
        html += `<label style="background:#000; padding:10px; border:1px solid #444; border-radius:4px; cursor:pointer;">
                    <input type="checkbox" ${isChecked} onchange="window.togglePartyLoot('${j}', this.checked)"> 
                    <img src="../img/imgpersonajes/${normalizarNombre(j)}icon.png" style="width:24px; height:24px; border-radius:50%; vertical-align:middle; margin-right:5px;" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                    ${j}
                 </label>`;
    });

    html += `   </div>
                <h4 style="color:var(--blue-life); margin-top:20px;">2. Multiplicador de Entrega (Por Clic)</h4>
                <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">`;
    
    [1, 5, 10, 50, 100].forEach(m => {
        html += `<button onclick="window.setPartyMult(${m})" style="background:${estadoUI.partyMult === m ? 'var(--gold)' : '#222'}; color:${estadoUI.partyMult === m ? '#000' : '#fff'}">x${m}</button>`;
    });

    html += `   </div>
            </div>
            
            <div class="container-hex" style="margin-bottom:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
                <textarea id="copy-log-loot" class="search-bar" readonly style="width:95%; height:80px; font-size:0.85em; margin-bottom:10px;">${estadoUI.logCopy || 'Bitácora de sesión...'}</textarea>
                <div style="display:flex; gap:10px;"><button onclick="window.copyToClipboard('copy-log-loot')" style="flex:3; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO</button><button onclick="window.limpiarLog()" style="flex:1; background:#8b0000; color:white;">X</button></div>
            </div>
            
            <h4 style="color:var(--gold);">3. Haz clic en la IMAGEN de un objeto para entregar <span style="color:white;">x${estadoUI.partyMult}</span></h4>
            <input type="text" id="busq-op" class="search-bar" placeholder="🔍 Buscar objeto..." value="${estadoUI.busquedaOP}" oninput="window.setBusquedaOP(this.value)">
            <div class="grid-control">`;

    estadoUI.cachedSortKeys.forEach(o => {
        if (!term || o.toLowerCase().includes(term)) {
            html += `<div class="control-card">
                        <img src="../img/imgobjetos/${normalizarNombre(o)}.png" 
                             onclick="window.giveLootToParty('${o}')" 
                             style="width:80px; height:80px; object-fit:cover; border:2px solid var(--gold); border-radius:8px; background:#000; cursor:pointer; transition:0.2s;" 
                             onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
                             onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                        <span class="item-name" style="margin-top:10px; color:#fff;">${o}</span>
                     </div>`;
        }
    });

    drawnHEXPreserveFocus('panel-party-loot', html + `</div>`);
}

export function dibujarTransferencia() {
    let html = `<h2>Mercado de Transferencias</h2>
                <button onclick="window.mostrarPagina('op-menu')" style="background:#444; margin-bottom: 20px;">⬅ Volver al Panel OP</button>
                <div style="display:flex; justify-content:center; gap:20px; align-items:center; flex-wrap:wrap; background:#1a0033; padding:20px; border-radius:8px; border:1px dashed var(--blue-life);">
                    <div style="text-align:center;">
                        <h4 style="color:#ff4d4d; margin:0 0 10px 0;">QUITAR DE (Origen)</h4>
                        <select id="trans-origen" class="search-bar" onchange="window.setTransOrigen(this.value)" style="width:200px; background:#4a0000;">
                            <option value="">-- Selecciona --</option>
                            ${Object.keys(invGlobal).sort().map(j => `<option value="${j}" ${estadoUI.transOrigen === j ? 'selected' : ''}>${j}</option>`).join('')}
                        </select>
                    </div>
                    <div style="font-size:2em; color:var(--gold);">➡</div>
                    <div style="text-align:center;">
                        <h4 style="color:#00ff00; margin:0 0 10px 0;">ENTREGAR A (Destino)</h4>
                        <select id="trans-destino" class="search-bar" onchange="window.setTransDestino(this.value)" style="width:200px; background:#004a00;">
                            <option value="">-- Selecciona --</option>
                            ${Object.keys(invGlobal).sort().map(j => `<option value="${j}" ${estadoUI.transDestino === j ? 'selected' : ''}>${j}</option>`).join('')}
                        </select>
                    </div>
                </div>`;
                
    if (estadoUI.transOrigen && estadoUI.transDestino) {
        if (estadoUI.transOrigen === estadoUI.transDestino) {
            html += `<h3 style="color:red; margin-top:20px;">El origen y el destino no pueden ser el mismo.</h3>`;
        } else {
            const j = estadoUI.transOrigen;
            const term = (estadoUI.busquedaOP || "").toLowerCase();
            
            html += `<div class="container-hex" style="margin-top:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
                        <textarea id="copy-log-trans" class="search-bar" readonly style="width:95%; height:80px; font-size:0.85em; margin-bottom:10px;">${estadoUI.logCopy || 'Bitácora de sesión...'}</textarea>
                        <div style="display:flex; gap:10px;"><button onclick="window.copyToClipboard('copy-log-trans')" style="flex:3; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO TOTAL</button><button onclick="window.limpiarLog()" style="flex:1; background:#8b0000; color:white;">X</button></div>
                     </div>
                     
                     <h4 style="color:var(--blue-life); margin-top:20px;">1. Selecciona Cuántos Quieres Pasar</h4>
                     <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
                        ${[1, 3, 5, 10, 50, 'TODO'].map(m => `<button onclick="window.setTransMult('${m}')" style="background:${estadoUI.transMult === m ? 'var(--gold)' : '#222'}; color:${estadoUI.transMult === m ? '#000' : '#fff'}">x${m}</button>`).join('')}
                     </div>

                     <h3 style="color:var(--gold);">2. Haz clic en la IMAGEN del inventario de ${j} para transferir</h3>
                     <input type="text" id="busq-op" class="search-bar" placeholder="🔍 Filtrar objeto a transferir..." value="${estadoUI.busquedaOP}" oninput="window.setBusquedaOP(this.value)">
                     <div class="grid-control">`;
            
            Object.keys(invGlobal[j]).sort().forEach(o => {
                if (invGlobal[j][o] > 0 && (!term || o.toLowerCase().includes(term))) {
                    const c = invGlobal[j][o];
                    const cantToPass = estadoUI.transMult === 'TODO' ? c : estadoUI.transMult;
                    html += `<div class="control-card item-con-stock">
                                <img src="../img/imgobjetos/${normalizarNombre(o)}.png" 
                                     onclick="window.ejecutarTransfer('${o}', ${cantToPass})" 
                                     style="width:80px; height:80px; object-fit:cover; cursor:pointer; border-radius:8px; border:2px solid #00ff00; transition:0.2s; box-shadow:0 0 10px #00ff00;"
                                     onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
                                     onerror="this.src='../img/imgobjetos/no_encontrado.png'" title="Clic para Transferir ${cantToPass}">
                                <span class="item-name" style="margin-top:10px;">${o}</span>
                                <span style="font-size:1.1em; color:white;">Stock: <b>${c}</b></span>
                             </div>`;
                }
            });
            html += `</div>`;
        }
    }
    drawnHEXPreserveFocus('panel-transferencia', html);
}

// CREACIÓN INDIVIDUAL
export function dibujarCreacionObjeto() {
    let html = `<h2>Creación Rápida (1 Objeto)</h2>
    <div class="container-hex" style="max-width:600px; background:rgba(30,0,60,0.9); padding:20px; border:1px solid #d4af37; border-radius:8px; margin:0 auto;">
        <input type="text" id="new-obj-name" class="search-bar" placeholder="Nombre..." oninput="window.updateCreationLog()" style="width:95%">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
            <select id="new-obj-tipo" class="search-bar" style="width:100%"><option>Consumible</option><option>Herramienta</option><option>Accesorio</option><option>Equipo</option></select>
            <select id="new-obj-mat" class="search-bar" style="width:100%"><option>Cristal</option><option>Metal</option><option>Orgánico</option><option>Sagrado</option></select>
        </div>
        <textarea id="new-obj-eff" class="search-bar" placeholder="Efecto..." oninput="window.updateCreationLog()" style="width:95%; height:60px; margin-top:10px;"></textarea>
        <select id="new-obj-rar" class="search-bar" style="width:95%; margin-top:10px;"><option>Común</option><option>Raro</option><option>Legendario</option></select>
        <h3 style="margin-top:20px; font-size:1em;">Entregar a (Opcional)</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">`;
    Object.keys(invGlobal).sort().forEach(j => {
        html += `<div style="text-align:left; font-size:0.8em; border-bottom:1px solid #333; padding:5px;"><label>${j}:</label><input type="number" class="cant-input" data-player="${j}" value="0" min="0" oninput="window.updateCreationLog()"></div>`;
    });
    html += `</div>
        <div style="margin-top:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
            <textarea id="copy-log-crea" class="search-bar" readonly style="width:95%; height:80px; font-size:0.85em; margin-bottom:10px;"></textarea>
            <button onclick="window.copyToClipboard('copy-log-crea')" style="width:100%; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO</button>
        </div>
        <button onclick="window.ejecutarAgregarObjeto()" style="width:100%; margin-top:20px; background:#006400; font-weight:bold;">FORJAR Y REPARTIR</button>
        <button onclick="window.mostrarPagina('op-menu')" style="width:100%; margin-top:10px; background:#444;">CANCELAR</button>
    </div>`;
    drawnHEXPreserveFocus('panel-creacion', html);
}

// CREACIÓN MÚLTIPLE (5 OBJETOS)
export function dibujarCreacionMulti() {
    let html = `<h2>Forja Múltiple (5 Objetos)</h2>
    <div class="container-hex" style="max-width:800px; background:rgba(30,0,60,0.9); padding:20px; border:1px solid #d4af37; border-radius:8px; margin:0 auto;">
        
        <h3 style="margin-top:0; font-size:1.1em; color:var(--gold);">Destinatario del Loot (Opcional)</h3>
        <select id="multi-player-dest" class="search-bar" style="width:100%; margin-bottom:20px;">
            <option value="">-- Nadie (Solo Crear en Catálogo) --</option>
            ${Object.keys(invGlobal).sort().map(j => `<option value="${j}">${j}</option>`).join('')}
        </select>
        
        <div id="multi-creation-container">`;
    
    for(let i=1; i<=5; i++) {
        html += `
        <div style="border: 1px dashed #555; padding: 15px; border-radius: 8px; margin-bottom: 15px; background:#0a0014;">
            <h4 style="margin:0 0 10px 0; color:var(--cyan-magic); text-align:left;">Objeto ${i}</h4>
            <input type="text" id="new-obj-name-${i}" class="search-bar" placeholder="Nombre del Objeto..." style="width:95%; margin-bottom:10px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 100px; gap:10px; margin-bottom:10px;">
                <select id="new-obj-tipo-${i}" class="search-bar" style="margin:0; width:100%;"><option>Consumible</option><option>Herramienta</option><option>Accesorio</option><option>Equipo</option></select>
                <select id="new-obj-mat-${i}" class="search-bar" style="margin:0; width:100%;"><option>Cristal</option><option>Metal</option><option>Orgánico</option><option>Sagrado</option></select>
                <select id="new-obj-rar-${i}" class="search-bar" style="margin:0; width:100%;"><option>Común</option><option>Raro</option><option>Legendario</option></select>
                <input type="number" id="new-obj-cant-${i}" class="search-bar" value="1" min="1" title="Cantidad a Entregar" style="margin:0; width:100%;">
            </div>
            <textarea id="new-obj-eff-${i}" class="search-bar" placeholder="Efecto o Descripción..." style="width:95%; height:45px; margin:0;"></textarea>
        </div>`;
    }

    html += `</div>
        <button onclick="window.ejecutarAgregarMulti()" style="width:100%; margin-top:20px; background:#006400; font-weight:bold; font-size:1.2em; padding:15px;">🔨 FORJAR MASIVAMENTE 🔨</button>
        <button onclick="window.mostrarPagina('op-menu')" style="width:100%; margin-top:10px; background:#444;">CANCELAR</button>
    </div>`;
    drawnHEXPreserveFocus('panel-creacion-multi', html);
}


