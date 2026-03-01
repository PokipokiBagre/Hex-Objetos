import { invGlobal, objGlobal, estadoUI } from './obj-state.js';

export function refrescarUI() { dibujarInventarios(); dibujarCatalogo(); dibujarControl(); }

function ordenarItems(j) {
    if (!j || !invGlobal[j]) return Object.keys(objGlobal).sort();
    return Object.keys(objGlobal).sort((a, b) => {
        const sA = invGlobal[j][a] || 0; const sB = invGlobal[j][b] || 0;
        if (sB !== sA) return sB - sA; return a.localeCompare(b);
    });
}

function mantenerFoco(id) {
    const input = document.getElementById(id);
    if (input && document.activeElement.id !== id) {
        input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    }
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
        html += `<input type="text" id="busq-inv" class="search-bar" placeholder="🔍 Buscar en inventario..." value="${estadoUI.busquedaInv}" oninput="window.setBusquedaInv(this.value)">`;
        html += `<div class='container-hex'><h3>${j}</h3><table><tr><th>Objeto</th><th>Efecto</th><th>Cant</th></tr>`;
        const term = estadoUI.busquedaInv.toLowerCase();
        ordenarItems(j).forEach(o => {
            if (invGlobal[j][o] > 0 && (!term || o.toLowerCase().includes(term))) {
                html += `<tr><td>${o}</td><td style="font-size:0.8em">${objGlobal[o]?.eff || '-'}</td><td>${invGlobal[j][o]}</td></tr>`;
            }
        });
        html += "</table></div>";
    }
    document.getElementById('contenedor-jugadores').innerHTML = html; mantenerFoco('busq-inv');
}

export function dibujarCatalogo() {
    let html = "<h2>Catálogo</h2><div style='text-align:center'>";
    ['Todos', 'Común', 'Raro', 'Legendario'].forEach(r => html += `<button onclick="window.setRar('${r}')">${r}</button> `);
    html += "<br><br>";
    ['Todos', 'Orgánico', 'Cristal', 'Metal', 'Sagrado'].forEach(m => html += `<button onclick="window.setMat('${m}')" style="background:#004a4a">${m}</button> `);
    html += `<br><br><input type="text" id="busq-cat" class="search-bar" placeholder="🔍 Buscar en catálogo..." value="${estadoUI.busquedaCat}" oninput="window.setBusquedaCat(this.value)"></div>`;
    html += `<br><table class='container-hex'><tr><th>Nombre</th><th>Efecto</th><th>Material</th><th>Rareza</th></tr>`;
    const term = estadoUI.busquedaCat.toLowerCase();
    Object.keys(objGlobal).sort().forEach(o => {
        const item = objGlobal[o];
        if ((estadoUI.filtroRar === 'Todos' || item.rar.includes(estadoUI.filtroRar)) && (estadoUI.filtroMat === 'Todos' || item.mat.includes(estadoUI.filtroMat))) {
            if (!term || o.toLowerCase().includes(term)) html += `<tr><td>${o}</td><td style="font-size:0.8em">${item.eff}</td><td>${item.mat}</td><td>${item.rar}</td></tr>`;
        }
    });
    document.getElementById('tabla-todos-objetos').innerHTML = html + "</table>"; mantenerFoco('busq-cat');
}

export function dibujarControl() {
    let html = "<h2>Editor de Stock</h2><div style='text-align:center'>";
    Object.keys(invGlobal).sort().forEach(j => {
        const active = estadoUI.jugadorControl === j ? 'style="border: 2px solid #d4af37"' : '';
        html += `<button onclick="window.setCtrl('${j}')" ${active}>${j}</button> `;
    });
    html += "</div><br>";
    if (estadoUI.jugadorControl) {
        const j = estadoUI.jugadorControl;
        html += `<input type="text" id="busq-op" class="search-bar" placeholder="🔍 Filtrar objeto..." value="${estadoUI.busquedaOP}" oninput="window.setBusqueda(this.value)">`;
        html += `<div class="grid-control">`;
        const term = estadoUI.busquedaOP.toLowerCase();
        ordenarItems(j).forEach(o => {
            if (!term || o.toLowerCase().includes(term)) {
                const c = invGlobal[j][o] || 0; const extraClass = c > 0 ? "item-con-stock" : "";
                html += `<div class="control-card ${extraClass}"><span class="item-name">${o} (<b>${c}</b>)</span><div class="item-btns"><button onclick="window.hexMod('${j}','${o}',1)">+1</button><button class="btn-neg" onclick="window.hexMod('${j}','${o}',-1)">-1</button></div><div class="item-btns" style="margin-top:5px"><button onclick="window.hexMod('${j}','${o}',5)" style="background:#004a4a">+5</button><button class="btn-neg" onclick="window.hexMod('${j}','${o}',-5)">-5</button></div></div>`;
            }
        });
        html += "</div>";
    }
    document.getElementById('panel-interactivo').innerHTML = html; mantenerFoco('busq-op');
}

export function dibujarMenuOP() {
    document.getElementById('menu-op-central').innerHTML = `
        <h2>Acceso OP</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 650px; margin: 0 auto;">
            <button onclick="window.mostrarPagina('control')">Editor de Stock</button>
            <button onclick="window.descargarInventariosJPG()" style="background:#8b0000">Descargar JPGs</button>
            <button onclick="window.descargarLog()" style="background:#004a4a">Descargar Log</button>
            <button onclick="window.descargarEstadoCSV()" style="background:#d4af37; color:#120024">Descargar CSV</button>
            <button onclick="window.subirLogManual()" style="background:#4a004a">Subir Log</button>
        </div>`;
}