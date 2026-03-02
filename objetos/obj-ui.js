import { invGlobal, objGlobal, estadoUI } from './obj-state.js';

function dibujarConFoco(containerId, html) {
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

// Normalización que permite la "ñ" para archivos en GitHub
const normalizarNombre = (str) => {
    if (!str) return "";
    return str.toString().trim().toLowerCase()
        .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9ñ_]/g, ''); 
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
                <p style="font-size:0.8em; color:#aaa;">Afinidad Máxima: <span style="color:#d4af37; font-weight:bold; text-transform:uppercase;">${maxAf}</span></p>
                <p style="font-size:0.85em; color:#eee;">${objGlobal[j]?.desc || "Sin descripción disponible."}</p>
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
                    <span style="font-size:0.65em; display:block; height:2.4em; overflow:hidden; color:#d4af37;">${o}</span>
                </div>`;
            });
            html += `</div><hr style="border:0; border-top:1px solid rgba(212,175,55,0.2); margin:20px 0;">`;
        }

        html += `<div class="table-responsive"><table class='container-hex'><tr><th>Imagen</th><th>Objeto</th><th>Efecto</th><th>Cant</th></tr>`;
        Object.keys(invGlobal[j]).sort().forEach(o => {
            if (invGlobal[j][o] > 0 && (!term || o.toLowerCase().includes(term))) {
                const imgFile = normalizarNombre(o);
                html += `<tr>
                    <td><img src="../img/imgobjetos/${imgFile}.png" class="cat-img" onclick="window.verImagen(this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'"></td>
                    <td style="font-weight:bold; color:#d4af37;">${o}</td>
                    <td style="text-align:left; font-size:0.85em;">${objGlobal[o]?.eff}</td>
                    <td>${invGlobal[j][o]}</td>
                </tr>`;
            }
        });
        html += "</table></div>";
    }
    dibujarConFoco('contenedor-jugadores', html);
}

export function dibujarCatalogo() {
    let html = "<h2>Catálogo</h2><div class='filter-group'>";
    ['Todos', 'Común', 'Raro', 'Legendario'].forEach(r => {
        const active = estadoUI.filtroRar === r ? 'class="btn-active"' : '';
        html += `<button onclick="window.setRar('${r}')" ${active}>${r}</button> `;
    });
    html += "</div><div class='filter-group'>";
    ['Todos', 'Orgánico', 'Cristal', 'Metal', 'Sagrado'].forEach(m => {
        const active = estadoUI.filtroMat === m ? 'style="background:#4a004a; border-color:#fff;"' : '';
        html += `<button onclick="window.setMat('${m}')" ${active}>${m}</button> `;
    });
    html += `</div><br><input type="text" id="busq-cat" class="search-bar" placeholder="🔍 Buscar..." value="${estadoUI.busquedaCat}" oninput="window.setBusquedaCat(this.value)">
    <div class="table-responsive"><table class='container-hex'><tr><th>Imagen</th><th>Nombre</th><th>Efecto</th><th>Material</th><th>Rareza</th></tr>`;
    const term = (estadoUI.busquedaCat || "").toLowerCase();
    Object.keys(objGlobal).sort().forEach(o => {
        const item = objGlobal[o];
        const matchR = estadoUI.filtroRar === 'Todos' || item.rar === estadoUI.filtroRar;
        const matchM = estadoUI.filtroMat === 'Todos' || item.mat === estadoUI.filtroMat;
        if (matchR && matchM && (!term || o.toLowerCase().includes(term))) {
            const imgFile = normalizarNombre(o);
            html += `<tr>
                <td><img src="../img/imgobjetos/${imgFile}.png" class="cat-img" onclick="window.verImagen(this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'"></td>
                <td style="font-weight:bold; color:#d4af37;">${o}</td>
                <td style="text-align:left; font-size:0.85em;">${item.eff}</td>
                <td>${item.mat}</td>
                <td>${item.rar}</td>
            </tr>`;
        }
    });
    dibujarConFoco('tabla-todos-objetos', html + "</table></div>");
}

export function dibujarControl() {
    let html = "<h2>Editor de Stock</h2><div style='text-align:center'>";
    Object.keys(invGlobal).sort().forEach(j => {
        const active = estadoUI.jugadorControl === j ? 'class="btn-active"' : '';
        html += `<button onclick="window.setCtrl('${j}')" ${active}>${j}</button> `;
    });
    html += `<br><br><button onclick="window.mostrarPagina('op-menu')" style="background:#444;">⬅ Menú OP</button></div><br>`;
    if (estadoUI.jugadorControl) {
        html += `<div class="container-hex" style="margin-bottom:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
                    <textarea id="copy-log-stock" class="search-bar" readonly style="width:95%; height:80px; font-size:0.85em; margin-bottom:10px; text-align:left;">${estadoUI.logCopy || 'Bitácora vacía...'}</textarea>
                    <div style="display:flex; gap:10px;"><button onclick="window.copyToClipboard('copy-log-stock')" style="flex:3; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO</button><button onclick="window.limpiarLog()" style="flex:1; background:#8b0000; color:white;">X</button></div>
                 </div><input type="text" id="busq-op" class="search-bar" placeholder="🔍 Filtrar objeto..." value="${estadoUI.busquedaOP}" oninput="window.setBusquedaOP(this.value)"><div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px;">`;
        ordenarItems(estadoUI.jugadorControl).forEach(o => {
            const term = (estadoUI.busquedaOP || "").toLowerCase();
            if (!term || o.toLowerCase().includes(term)) {
                const c = invGlobal[estadoUI.jugadorControl][o] || 0; const cl = c > 0 ? "item-con-stock" : "";
                html += `<div style="background:rgba(30,0,60,0.9); border:1px solid #d4af37; padding:10px; border-radius:8px; text-align:center;">
                            <span style="font-size:0.85em; font-weight:bold; margin-bottom:10px; display:block;">${o} (<b>${c}</b>)</span>
                            <div style="display:flex; gap:5px;"><button onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',1)" style="flex:1;">+1</button><button onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',-1)" style="flex:1; background:#4a0000;">-1</button></div>
                         </div>`;
            }
        });
        html += "</div>";
    }
    document.getElementById('panel-interactivo').innerHTML = html;
}

export function dibujarMenuOP() {
    document.getElementById('menu-op-central').innerHTML = `
        <h2>Acceso OP</h2>
        <div class="main-grid" style="max-width: 700px; margin: 0 auto; gap: 15px;">
            <button onclick="window.mostrarPagina('control')" style="padding: 20px;">Editor de Stock</button>
            <button onclick="window.mostrarCreacionObjeto()" style="padding: 20px; background:#4a004a">Creación de Objetos</button>
            <button onclick="window.descargarInventariosJPG()" style="padding: 20px; background:#8b0000; color: white;">Descargar JPGs</button>
            <button onclick="window.descargarLog()" style="padding: 20px; background:#004a4a; color: white;">Descargar Log</button>
            <button onclick="window.descargarEstadoCSV()" style="padding: 20px; background:#d4af37; color:#120024">Descargar CSV</button>
            <button onclick="window.mostrarPagina('inventarios')" style="padding: 20px; background:#444;">Cerrar OP</button>
        </div>`;
}
