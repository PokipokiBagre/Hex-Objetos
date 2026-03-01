import { invGlobal, objGlobal, estadoUI } from './obj-state.js';

export function refrescarUI() { dibujarInventarios(); dibujarCatalogo(); dibujarControl(); }

const raridadValor = { "Legendario": 3, "Raro": 2, "Común": 1, "-": 0 };

// Función para limpiar nombres de archivos (sin tildes, minúsculas, guiones)
const normalizarNombre = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '_');
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
            <img src="../img/imgpersonajes/${normalizarNombre(j)}icon.png" class="player-icon" onerror="this.src='../img/icon.png'">
            <div class="player-info">
                <h3>${j}</h3>
                <p class="afinidad-tag">Afinidad Máxima: <span>${maxAf}</span></p>
                <p class="player-desc">${objGlobal[j]?.desc || "Sin descripción de personaje disponible."}</p>
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
                html += `
                <div class="top-item-card rarity-${objGlobal[o]?.rar.toLowerCase()}">
                    <img src="../img/imgobjetos/${imgFile}.png" onerror="this.src='../img/objetos.png'">
                    <span class="top-item-name">${o}</span>
                </div>`;
            });
            html += `</div><hr style="border:0; border-top:1px solid rgba(212,175,55,0.2); margin:20px 0;">`;
        }

        html += `<div class="table-responsive"><table class='container-hex'><tr><th>Objeto</th><th>Efecto</th><th>Cant</th></tr>`;
        ordenarItems(j).forEach(o => {
            if (invGlobal[j][o] > 0 && (!term || o.toLowerCase().includes(term))) {
                html += `<tr><td style="font-weight:bold; color:#d4af37;">${o}</td><td style="text-align:left; font-size:0.85em;">${objGlobal[o]?.eff}</td><td>${invGlobal[j][o]}</td></tr>`;
            }
        });
        html += "</table></div>";
    }
    document.getElementById('contenedor-jugadores').innerHTML = html;
}

// --- MANTENER INTACTO: FUNCIONES OP Y CONTROL ---
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
                    <div style="display:flex; gap:10px;"><button onclick="window.copyToClipboard('copy-log-stock')" style="flex:3; background:#d4af37; color:#120024; font-weight:bold;">COPIAR</button><button onclick="window.limpiarLog()" style="flex:1; background:#8b0000; color:white;">X</button></div>
                 </div><input type="text" id="busq-op" class="search-bar" placeholder="🔍 Filtrar objeto..." value="${estadoUI.busquedaOP}" oninput="window.setBusquedaOP(this.value)"><div class="grid-control">`;
        ordenarItems(estadoUI.jugadorControl).forEach(o => {
            const term = estadoUI.busquedaOP.toLowerCase();
            if (!term || o.toLowerCase().includes(term)) {
                const c = invGlobal[estadoUI.jugadorControl][o] || 0; const cl = c > 0 ? "item-con-stock" : "";
                html += `<div class="control-card ${cl}"><span class="item-name">${o} (<b>${c}</b>)</span><div class="item-btns"><button onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',1)">+1</button><button class="btn-neg" onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',-1)">-1</button></div></div>`;
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

export function dibujarCatalogo() {
    let html = "<h2>Catálogo</h2><div class='filter-group'>";
    ['Todos', 'Común', 'Raro', 'Legendario'].forEach(r => {
        const active = estadoUI.filtroRar === r ? 'class="btn-active"' : '';
        html += `<button onclick="window.setRar('${r}')" ${active}>${r}</button> `;
    });
    html += "</div><div class='filter-group' style='margin-top:10px;'>";
    ['Todos', 'Orgánico', 'Cristal', 'Metal', 'Sagrado'].forEach(m => {
        const active = estadoUI.filtroMat === m ? 'class="btn-active-mat"' : '';
        html += `<button onclick="window.setMat('${m}')" ${active}>${m}</button> `;
    });
    html += `</div><br><input type="text" id="busq-cat" class="search-bar" placeholder="🔍 Buscar..." value="${estadoUI.busquedaCat}" oninput="window.setBusquedaCat(this.value)">
    <div class="table-responsive"><table class='container-hex'><tr><th>Nombre</th><th>Efecto</th><th>Material</th><th>Rareza</th></tr>`;
    const term = (estadoUI.busquedaCat || "").toLowerCase();
    Object.keys(objGlobal).sort().forEach(o => {
        const item = objGlobal[o];
        const matchR = estadoUI.filtroRar === 'Todos' || item.rar === estadoUI.filtroRar;
        const matchM = estadoUI.filtroMat === 'Todos' || item.mat === estadoUI.filtroMat;
        if (matchR && matchM && (!term || o.toLowerCase().includes(term))) {
            html += `<tr><td>${o}</td><td style="text-align:left; font-size:0.85em;">${item.eff}</td><td>${item.mat}</td><td>${item.rar}</td></tr>`;
        }
    });
    document.getElementById('tabla-todos-objetos').innerHTML = html + "</table></div>";
}
