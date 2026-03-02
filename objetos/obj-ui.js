import { invGlobal, objGlobal, estadoUI } from './obj-state.js';

function drawnHEXPreserveFocus(containerId, html) {
    const activeId = document.activeElement.id;
    const start = document.activeElement.selectionStart;
    const end = document.activeElement.selectionEnd;
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = html;
        if (activeId) {
            const el = document.getElementById(activeId);
            if (el) { el.focus(); if (el.setSelectionRange) el.setSelectionRange(start, end); }
        }
    }
}

export function refrescarUI() { dibujarInventarios(); dibujarCatalogo(); dibujarControl(); }

const raridadValor = { "Legendario": 3, "Raro": 2, "Común": 1, "-": 0 };

const normalizarNombre = (str) => {
    if (!str) return "";
    return str.toString().trim().toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/\s+/g,'_').replace(/[^a-z0-9ñ_]/g,''); 
};

function ordenarItems(j) {
    if (!j || !invGlobal[j]) return Object.keys(objGlobal).sort();
    return Object.keys(objGlobal).sort((a, b) => {
        const sA = invGlobal[j][a] || 0; const sB = invGlobal[j][b] || 0;
        if (sB !== sA) return sB - sA; return a.localeCompare(b);
    });
}

export function dibujarInventarios() {
    let html = "<h2>Inventarios</h2><div class='filter-group'>";
    Object.keys(invGlobal).sort().forEach(j => {
        const active = estadoUI.jugadorInv === j ? 'class="btn-active"' : '';
        html += `<button onclick="window.setInv('${j}')" ${active}>${j}</button> `;
    });
    html += "</div><br>";

    if (estadoUI.jugadorInv) {
        const j = estadoUI.jugadorInv;
        const term = (estadoUI.busquedaInv || "").toLowerCase();
        const afins = objGlobal[j]?.afinidades || {};
        const maxAf = Object.entries(afins).reduce((a, b) => (a[1] > b[1] ? a : b), ["Ninguna", 0])[0];
        
        html += `
        <div class="player-header">
            <img src="../img/imgpersonajes/${normalizarNombre(j)}icon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
            <div style="text-align:left; flex:1;">
                <h3>${j}</h3>
                <p class="afinidad-tag">Afinidad Máxima: <span style="color:#d4af37; font-weight:bold;">${maxAf}</span></p>
                <p class="player-desc">${objGlobal[j]?.desc || "Sin descripción disponible."}</p>
            </div>
        </div>
        <input type="text" id="busq-inv" class="search-bar" placeholder="🔍 Filtrar equipo..." value="${estadoUI.busquedaInv}" oninput="window.setBusquedaInv(this.value)">`;

        const destacados = Object.keys(invGlobal[j])
            .filter(o => invGlobal[j][o] > 0 && (!term || o.toLowerCase().includes(term)))
            .sort((a, b) => raridadValor[objGlobal[b]?.rar] - raridadValor[objGlobal[a]?.rar])
            .slice(0, 5);

        if (destacados.length > 0) {
            html += `<div class="top-items-grid">`;
            destacados.forEach(o => {
                const imgFile = normalizarNombre(o);
                const rarClase = objGlobal[o]?.rar === 'Raro' ? 'rarity-raro' : (objGlobal[o]?.rar === 'Legendario' ? 'rarity-legendario' : '');
                html += `
                <div class="top-item-card ${rarClase}">
                    <img src="../img/imgobjetos/${imgFile}.png" onclick="window.verImagen(this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                    <span style="font-size:0.65em; display:block; height:2.4em; overflow:hidden; color:#d4af37; cursor:pointer;" onclick="window.verImagenByName('${o}')">${o}</span>
                </div>`;
            });
            html += `</div><hr style="border:0; border-top:1px solid rgba(212,175,55,0.2); margin:20px 0;">`;
        }

        html += `<div class="table-responsive"><table><tr><th>Imagen</th><th>Objeto</th><th>Efecto</th><th>Cant</th></tr>`;
        Object.keys(invGlobal[j]).sort().forEach(o => {
            if (invGlobal[j][o] > 0 && (!term || o.toLowerCase().includes(term))) {
                const imgFile = normalizarNombre(o);
                html += `<tr>
                    <td><img src="../img/imgobjetos/${imgFile}.png" class="cat-img" onclick="window.verImagen(this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'"></td>
                    <td style="font-weight:bold; color:#d4af37; cursor:pointer;" onclick="window.verImagenByName('${o}')">${o}</td>
                    <td style="text-align:left; font-size:0.85em;">${objGlobal[o]?.eff}</td>
                    <td>${invGlobal[j][o]}</td>
                </tr>`;
            }
        });
        html += "</table></div>";
    }
    drawnHEXPreserveFocus('contenedor-jugadores', html);
}

export function dibujarCatalogo() {
    let html = "<h2>Catálogo</h2><div class='filter-group'>";
    ['Todos', 'Común', 'Raro', 'Legendario'].forEach(r => { html += `<button onclick="window.setRar('${r}')">${r}</button> `; });
    html += "</div><div class='filter-group'>";
    ['Todos', 'Orgánico', 'Cristal', 'Metal', 'Sagrado'].forEach(m => { html += `<button onclick="window.setMat('${m}')" class="btn-active-mat">${m}</button> `; });
    html += `</div><br><input type="text" id="busq-cat" class="search-bar" placeholder="🔍 Buscar..." value="${estadoUI.busquedaCat}" oninput="window.setBusquedaCat(this.value)">
    <div class="table-responsive"><table><tr><th>Imagen</th><th>Nombre</th><th>Efecto</th><th>Rareza</th></tr>`;
    const term = (estadoUI.busquedaCat || "").toLowerCase();
    Object.keys(objGlobal).sort().forEach(o => {
        if (!term || o.toLowerCase().includes(term)) {
            html += `<tr>
                <td><img src="../img/imgobjetos/${normalizarNombre(o)}.png" class="cat-img" onclick="window.verImagen(this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'"></td>
                <td style="font-weight:bold; color:#d4af37; cursor:pointer;" onclick="window.verImagenByName('${o}')">${o}</td>
                <td style="text-align:left; font-size:0.85em;">${objGlobal[o].eff}</td>
                <td>${objGlobal[o].rar}</td>
            </tr>`;
        }
    });
    drawnHEXPreserveFocus('tabla-todos-objetos', html + "</table></div>");
}

// RESTAURADO: EDITOR DE STOCK CON 4 BOTONES
export function dibujarControl() {
    let html = "<h2>Editor de Stock</h2><div style='text-align:center'>";
    Object.keys(invGlobal).sort().forEach(j => {
        const active = estadoUI.jugadorControl === j ? 'class="btn-active"' : '';
        html += `<button onclick="window.setCtrl('${j}')" ${active}>${j}</button> `;
    });
    html += `<br><br><button onclick="window.mostrarPagina('op-menu')" style="background:#444;">⬅ Menú OP</button></div><br>`;
    
    if (estadoUI.jugadorControl) {
        html += `<div class="container-hex" style="margin-bottom:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
                    <textarea id="copy-log-stock" class="search-bar" readonly style="width:95%; height:60px; font-size:0.85em; margin-bottom:10px;">${estadoUI.logCopy || 'Bitácora de sesión...'}</textarea>
                    <button onclick="window.copyToClipboard('copy-log-stock')" style="width:100%; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO TOTAL</button>
                    <br><br><button onclick="window.limpiarLog()" style="width:100%; background:#8b0000; color:white;">LIMPIAR BITÁCORA</button>
                 </div><input type="text" id="busq-op" class="search-bar" placeholder="🔍 Filtrar objeto..." value="${estadoUI.busquedaOP}" oninput="window.setBusquedaOP(this.value)">
                 <div class="grid-control">`;
        
        ordenarItems(estadoUI.jugadorControl).forEach(o => {
            const term = (estadoUI.busquedaOP || "").toLowerCase();
            if (!term || o.toLowerCase().includes(term)) {
                const c = invGlobal[estadoUI.jugadorControl][o] || 0;
                const cl = c > 0 ? "item-con-stock" : "";
                html += `<div class="control-card ${cl}">
                            <span class="item-name">${o} (<b>${c}</b>)</span>
                            <div class="item-btns">
                                <button onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',1)">+1</button>
                                <button class="btn-neg" onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',-1)">-1</button>
                            </div>
                            <div class="item-btns" style="margin-top:5px">
                                <button onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',5)" style="background:#004a4a">+5</button>
                                <button class="btn-neg" onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',-5)" style="background:#4a0000">-5</button>
                            </div>
                         </div>`;
            }
        });
        html += "</div>";
    }
    drawnHEXPreserveFocus('panel-interactivo', html);
}

// RESTAURADO: MENÚ OP ORDENADO
export function dibujarMenuOP() {
    document.getElementById('menu-op-central').innerHTML = `
        <h2>Acceso OP</h2>
        <div class="op-grid">
            <button onclick="window.mostrarPagina('control')">Editor de Stock</button>
            <button onclick="window.mostrarCreacionObjeto()" style="background:#4a004a">Creación de Objetos</button>
            <button onclick="window.descargarInventariosJPG()" style="background:#8b0000">Descargar JPGs</button>
            <button onclick="window.descargarLog()" style="background:#004a4a">Descargar Log</button>
            <button onclick="window.descargarEstadoCSV()" style="background:#d4af37; color:#000">Descargar CSV</button>
            <button onclick="window.mostrarPagina('inventarios')" style="background:#444;">Cerrar OP</button>
        </div>`;
}

// RESTAURADO: CREACIÓN DE OBJETOS COMPLETA
export function dibujarCreacionObjeto() {
    let html = `<h2>Creación de Objetos</h2>
    <div class="container-hex" style="max-width:600px; background:rgba(30,0,60,0.9); padding:20px; border:1px solid #d4af37; border-radius:8px; margin:0 auto;">
        <input type="text" id="new-obj-name" class="search-bar" placeholder="Nombre..." oninput="window.updateCreationLog()" style="width:95%">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
            <select id="new-obj-tipo" class="search-bar" style="width:100%"><option>Consumible</option><option>Herramienta</option><option>Accesorio</option><option>Equipo</option></select>
            <select id="new-obj-mat" class="search-bar" style="width:100%"><option>Cristal</option><option>Metal</option><option>Orgánico</option><option>Sagrado</option></select>
        </div>
        <textarea id="new-obj-eff" class="search-bar" placeholder="Efecto..." oninput="window.updateCreationLog()" style="width:95%; height:60px; margin-top:10px;"></textarea>
        <select id="new-obj-rar" class="search-bar" style="width:95%; margin-top:10px;"><option>Común</option><option>Raro</option><option>Legendario</option></select>
        <h3 style="margin-top:20px; font-size:1em;">Cantidades por Jugador</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">`;
    
    Object.keys(invGlobal).sort().forEach(j => {
        html += `<div style="text-align:left; font-size:0.8em; border-bottom:1px solid #333; padding:5px;"><label>${j}:</label><input type="number" class="cant-input" data-player="${j}" value="0" min="0" oninput="window.updateCreationLog()"></div>`;
    });

    html += `</div>
        <div style="margin-top:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
            <textarea id="copy-log-crea" class="search-bar" readonly style="width:95%; height:80px; font-size:0.85em; margin-bottom:10px;"></textarea>
            <button onclick="window.copyToClipboard('copy-log-crea')" style="width:100%; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO</button>
        </div>
        <button onclick="window.ejecutarAgregarObjeto()" style="width:100%; margin-top:20px; background:#006400; font-weight:bold;">CREAR Y DEFINIR DUEÑO</button>
        <button onclick="window.mostrarPagina('op-menu')" style="width:100%; margin-top:10px; background:#444;">CANCELAR</button>
    </div>`;
    document.getElementById('panel-interactivo').innerHTML = html;
}
