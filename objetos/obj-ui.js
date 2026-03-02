import { invGlobal, objGlobal, estadoUI } from './obj-state.js';
import { descargarInventariosJPG } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP, dibujarInventarios, dibujarCatalogo, dibujarControl } from './obj-ui.js';
import { normalizarNombre } from './obj-data.js';

// Mantiene el foco y la posición del cursor para evitar el lag al escribir
function dibujarConFoco(containerId, html) {
    const activeId = document.activeElement.id;
    const start = document.activeElement.selectionStart;
    const end = document.activeElement.selectionEnd;
    
    const container = document.getElementById(containerId);
    if (!container) return; // Evita errores si el contenedor no existe
    container.innerHTML = html;
    
    if (activeId) {
        const el = document.getElementById(activeId);
        if (el) {
            el.focus();
            if (el.setSelectionRange) el.setSelectionRange(start, end);
        }
    }
}

export function refrescarUI() { dibujarInventarios(); dibujarCatalogo(); dibujarControl(); }

const raridadValor = { "Legendario": 3, "Raro": 2, "Común": 1, "-": 0 };

// Normalización que respeta la "ñ" para que coincida con tus archivos
export function normalizarNombre(str) {
    if (!str) return "";
    return str.toString().trim().toLowerCase()
        .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9ñ_]/g, ''); // Mantenemos la 'ñ'
}

export function dibujarInventarios() {
    const term = (estadoUI.busquedaInv || "").toLowerCase();
    
    // FILTRAMOS OBJETOS DEL JUGADOR ACTUAL
    const objetosLinda = Object.keys(objGlobal).filter(o => 
        (o === "Zanahoria" || o === "Agua en polvo" || o === "Muñeco de Poco" || o === "Muñeco de Pinguino") &&
        (!term || o.toLowerCase().includes(term))
    );

    // DETERMINAMOS OBJETOS DESTACADOS (TOP 5 POR RAREZA)
    const destacados = objetosLinda
        .sort((a, b) => raridadValor[objGlobal[b]?.rar] - raridadValor[objGlobal[a]?.rar])
        .slice(0, 5);

    let html = `
        <h2>Inventarios</h2>
        <div class="player-header">
            <img src="../img/imgpersonajes/lindaicon.png" class="player-icon" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
            <div class="player-info">
                <h3>Linda</h3>
                <p>Nivel 15 | Humana</p>
                <p class="afinidad-tag">Afinidad Física | Afinid.</p>
                <p class="player-desc">Un fetiche de protección con el espíritu de Poco. Aumenta la afinidad Física y Espiritual.</p>
            </div>
        </div>
        
        <input type="text" id="busq-inv" class="search-bar" placeholder="🔍 Muñeco" value="${estadoUI.busquedaInv}" oninput="window.setBusquedaInv(this.value)">

        <h3>OBJETOS DESTACADOS</h3>
        <div class="top-items-grid">
    `;

    // AÑADIMOS OBJETOS DESTACADOS CON MARCOS DE RAREZA ACTUALIZADOS
    destacados.forEach(o => {
        const item = objGlobal[o];
        const imgFile = normalizarNombre(o);
        const rarezaClase = item?.rar === 'Raro' ? 'rarity-rare' : (item?.rar === 'Legendario' ? 'rarity-legendary' : '');
        html += `
            <div class="top-item-card ${rarezaClase}">
                <img src="../img/imgobjetos/${imgFile}.png" onclick="window.verImagen('${o}', this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                <p>${o}</p>
                <p class="rarity-tag">${item?.rar || ''}</p>
            </div>
        `;
    });

    html += `
        </div>
        <hr>
        
        <div class='table-responsive'><table class='container-hex'>
            <tr><th>Imagen</th><th>Descripción</th><th>Identidad</th><th>Rareza</th></tr>
    `;

    // AÑADIMOS OBJETOS AL CATÁLOGO (FILTRADOS)
    objetosLinda.forEach(o => {
        const item = objGlobal[o];
        const imgFile = normalizarNombre(o);
        html += `
            <tr>
                <td><img src="../img/imgobjetos/${imgFile}.png" class="cat-img" onclick="window.verImagen('${o}', this.src)" onerror="this.src='../img/imgobjetos/no_encontrado.png'"></td>
                <td>${o}</td>
                <td>${item?.tipo || ''}</td>
                <td>${item?.rar || ''}</td>
            </tr>
        `;
    });

    html += "</table></div>";
    
    dibujarConFoco('contenedor-jugadores', html);
}

// ... Las funciones dibujarCatalogo(), dibujarControl() y dibujarMenuOP() se mantienen como estaban, solo asegurándose de llamar a verImagen() en las imágenes.

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

// --- TUS FUNCIONES OP Y CONTROL (INTACTAS) ---
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
                    <div style="display:flex; gap:10px;"><button onclick="window.copyToClipboard('copy-log-stock')" style="flex:3; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO TOTAL</button><button onclick="window.limpiarLog()" style="flex:1; background:#8b0000; color:white;">X</button></div>
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

