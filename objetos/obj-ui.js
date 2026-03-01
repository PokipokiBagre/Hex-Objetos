import { invGlobal, objGlobal, estadoUI } from './obj-state.js';

export function refrescarUI() { dibujarInventarios(); dibujarCatalogo(); dibujarControl(); }

function ordenarItems(j) {
    if (!j || !invGlobal[j]) return Object.keys(objGlobal).sort();
    return Object.keys(objGlobal).sort((a, b) => {
        const sA = invGlobal[j][a] || 0; const sB = invGlobal[j][b] || 0;
        if (sB !== sA) return sB - sA; return a.localeCompare(b);
    });
}

export function dibujarControl() {
    let html = "<h2>Editor de Stock</h2><div style='text-align:center'>";
    Object.keys(invGlobal).sort().forEach(j => {
        const active = estadoUI.jugadorControl === j ? 'style="border: 2px solid #d4af37"' : '';
        html += `<button onclick="window.setCtrl('${j}')" ${active}>${j}</button> `;
    });
    html += `<br><br><button onclick="window.mostrarPagina('op-menu')" style="background:#444;">⬅ Menú OP</button></div><br>`;
    
    if (estadoUI.jugadorControl) {
        html += `<div class="container-hex" style="margin-bottom:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
                    <textarea id="copy-log-stock" class="search-bar" readonly style="width:95%; height:80px; font-size:0.85em; margin-bottom:10px; text-align:left;">${estadoUI.logCopy || 'Bitácora vacía...'}</textarea>
                    <div style="display:flex; gap:10px;">
                        <button onclick="window.copyToClipboard('copy-log-stock')" style="flex:3; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO TOTAL</button>
                        <button onclick="window.limpiarLog()" style="flex:1; background:#8b0000; color:white;">LIMPIAR</button>
                    </div>
                 </div>`;
        html += `<input type="text" id="busq-op" class="search-bar" placeholder="🔍 Filtrar..." value="${estadoUI.busquedaOP}" oninput="window.setBusqueda(this.value)">`;
        html += `<div class="grid-control">`;
        const term = estadoUI.busquedaOP.toLowerCase();
        ordenarItems(estadoUI.jugadorControl).forEach(o => {
            if (!term || o.toLowerCase().includes(term)) {
                const c = invGlobal[estadoUI.jugadorControl][o] || 0; const cl = c > 0 ? "item-con-stock" : "";
                html += `<div class="control-card ${cl}"><span class="item-name">${o} (<b>${c}</b>)</span><div class="item-btns"><button onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',1)">+1</button><button class="btn-neg" onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',-1)">-1</button></div><div class="item-btns" style="margin-top:5px"><button onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',5)" style="background:#004a4a">+5</button><button class="btn-neg" onclick="window.hexMod('${estadoUI.jugadorControl}','${o}',-5)" style="background:#4a0000">-5</button></div></div>`;
            }
        });
        html += "</div>";
    }
    document.getElementById('panel-interactivo').innerHTML = html;
}

export function dibujarCreacionObjeto() {
    let html = `<h2>Creación de Objetos</h2>
    <div class="container-hex" style="max-width:600px; background:rgba(30,0,60,0.9); padding:20px; border:1px solid #d4af37; border-radius:8px;">
        <input type="text" id="new-obj-name" class="search-bar" placeholder="Nombre..." oninput="window.updateCreationLog()" style="width:95%">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
            <select id="new-obj-tipo" class="search-bar" onchange="window.updateCreationLog()" style="width:100%"><option>Consumible</option><option>Herramienta</option><option>Accesorio</option><option>Equipo</option></select>
            <select id="new-obj-mat" class="search-bar" onchange="window.updateCreationLog()" style="width:100%"><option>Cristal</option><option>Metal</option><option>Orgánico</option><option>Sagrado</option></select>
        </div>
        <textarea id="new-obj-eff" class="search-bar" placeholder="Efecto..." oninput="window.updateCreationLog()" style="width:95%; height:60px; margin-top:10px;"></textarea>
        <select id="new-obj-rar" class="search-bar" onchange="window.updateCreationLog()" style="width:95%; margin-top:10px;"><option>Común</option><option>Raro</option><option>Legendario</option></select>
        <h3 style="margin-top:20px; font-size:1em;">Cantidades por Jugador</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">`;
    Object.keys(invGlobal).sort().forEach(j => {
        html += `<div style="text-align:left; font-size:0.8em; border-bottom:1px solid #333; padding:5px;"><label>${j}:</label><input type="number" class="cant-input" data-player="${j}" value="0" min="0" oninput="window.updateCreationLog()" style="width:50px; float:right; background:#120024; color:white; border:1px solid #d4af37;"></div>`;
    });
    html += `</div>
        <div style="margin-top:20px; background:#1a0033; padding:15px; border:1px dashed #d4af37;">
            <textarea id="copy-log-crea" class="search-bar" readonly style="width:95%; height:100px; font-size:0.85em; margin-bottom:10px; text-align:left;"></textarea>
            <button onclick="window.copyToClipboard('copy-log-crea')" style="width:100%; background:#d4af37; color:#120024; font-weight:bold;">COPIAR REGISTRO</button>
        </div>
        <button onclick="window.ejecutarAgregarObjeto()" style="width:100%; margin-top:20px; background:#006400; font-weight:bold;">CREAR Y DEFINIR DUEÑO</button>
        <button onclick="window.mostrarPagina('op-menu')" style="width:100%; margin-top:10px; background:#444;">CANCELAR</button>
    </div>`;
    document.getElementById('panel-interactivo').innerHTML = html;
}

export function dibujarMenuOP() {
    document.getElementById('menu-op-central').innerHTML = `
        <h2>Acceso OP</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 650px; margin: 0 auto;">
            <button onclick="window.mostrarPagina('control')">Editor de Stock</button>
            <button onclick="window.mostrarCreacionObjeto()" style="background:#4a004a">Creación de Objetos</button>
            <button onclick="window.descargarInventariosJPG()" style="background:#8b0000">Descargar JPGs</button>
            <button onclick="window.descargarLog()" style="background:#004a4a">Descargar Log</button>
            <button onclick="window.descargarEstadoCSV()" style="background:#d4af37; color:#120024">Descargar CSV</button>
        </div>`;
}

export function dibujarInventarios() {
    let html = "<h2>Inventarios</h2><div style='text-align:center'>";
    Object.keys(invGlobal).sort().forEach(j => {
        const active = estadoUI.jugadorInv === j ? 'style="border: 2px solid #d4af37"' : '';
        html += `<button onclick="window.setInv('${j}')" ${active}>${j}</button> `;
    });
    html += "</div><br>";
    if (estadoUI.jugadorInv) {
        const j = estadoUI.jugadorInv;
        html += `<input type="text" id="busq-inv" class="search-bar" placeholder="🔍 Buscar..." value="${estadoUI.busquedaInv}" oninput="window.setBusquedaInv(this.value)">`;
        html += `<div class='container-hex'><h3>${j}</h3><table><tr><th>Objeto</th><th>Efecto</th><th>Cant</th></tr>`;
        const term = estadoUI.busquedaInv.toLowerCase();
        ordenarItems(j).forEach(o => {
            if (invGlobal[j][o] > 0 && (!term || o.toLowerCase().includes(term))) html += `<tr><td>${o}</td><td style="font-size:0.8em">${objGlobal[o]?.eff || '-'}</td><td>${invGlobal[j][o]}</td></tr>`;
        });
        html += "</table></div>";
    }
    document.getElementById('contenedor-jugadores').innerHTML = html;
}

export function dibujarCatalogo() {
    let html = "<h2>Catálogo</h2><div style='text-align:center'>";
    ['Todos', 'Común', 'Raro', 'Legendario'].forEach(r => html += `<button onclick="window.setRar('${r}')">${r}</button> `);
    html += `<br><br><input type="text" id="busq-cat" class="search-bar" placeholder="🔍 Buscar..." value="${estadoUI.busquedaCat}" oninput="window.setBusquedaCat(this.value)"></div>`;
    html += `<br><table class='container-hex'><tr><th>Nombre</th><th>Efecto</th><th>Rareza</th></tr>`;
    const term = estadoUI.busquedaCat.toLowerCase();
    Object.keys(objGlobal).sort().forEach(o => {
        const item = objGlobal[o];
        if (estadoUI.filtroRar === 'Todos' || item.rar.includes(estadoUI.filtroRar)) {
            if (!term || o.toLowerCase().includes(term)) html += `<tr><td>${o}</td><td style="font-size:0.8em">${item.eff}</td><td>${item.rar}</td></tr>`;
        }
    });
    document.getElementById('tabla-todos-objetos').innerHTML = html + "</table>";
}

