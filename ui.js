import { invGlobal, objGlobal, estadoUI } from './state.js';

export function refrescarUI() { dibujarInventarios(); dibujarCatalogo(); dibujarControl(); }

function ordenarItems(j) {
    if (!j || !invGlobal[j]) return Object.keys(objGlobal).sort();
    return Object.keys(objGlobal).sort((a, b) => {
        const sA = invGlobal[j][a] || 0;
        const sB = invGlobal[j][b] || 0;
        if (sB !== sA) return sB - sA;
        return a.localeCompare(b); // A-Z
    });
}

export function dibujarMenuOP() {
    // ELIMINADOS SINCRONIZAR Y RESET: Ahora todo lo hace el botón "Actualizar"
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

export function dibujarInventarios() {
    let html = "<h2>Inventarios</h2><div style='text-align:center'>";
    Object.keys(invGlobal).sort().forEach(j => html += `<button onclick="window.setInv('${j}')">${j}</button> `);
    html += "</div><br>";
    if (estadoUI.jugadorInv) {
        const j = estadoUI.jugadorInv;
        html += `<div class='container-hex'><h3>${j}</h3><table><tr><th>Objeto</th><th>Efecto</th><th>Cant</th></tr>`;
        ordenarItems(j).forEach(o => {
            if(invGlobal[j][o] > 0) html += `<tr><td>${o}</td><td style="font-size:0.8em">${objGlobal[o]?.eff || '-'}</td><td>${invGlobal[j][o]}</td></tr>`;
        });
        html += "</table></div>";
    }
    document.getElementById('contenedor-jugadores').innerHTML = html;
}

export function dibujarCatalogo() {
    let html = "<h2>Catálogo</h2><div style='text-align:center'>";
    ['Todos', 'Común', 'Raro', 'Legendario'].forEach(r => html += `<button onclick="window.setRar('${r}')">${r}</button> `);
    html += "<br><br>";
    ['Todos', 'Orgánico', 'Cristal', 'Metal', 'Sagrado'].forEach(m => html += `<button onclick="window.setMat('${m}')" style="background:#004a4a">${m}</button> `);
    html += "</div><br><table class='container-hex'><tr><th>Nombre</th><th>Efecto</th><th>Material</th><th>Rareza</th></tr>";
    Object.keys(objGlobal).sort().forEach(o => {
        const item = objGlobal[o];
        if ((estadoUI.filtroRar === 'Todos' || item.rar.includes(estadoUI.filtroRar)) && (estadoUI.filtroMat === 'Todos' || item.mat.includes(estadoUI.filtroMat))) {
            html += `<tr><td>${o}</td><td style="font-size:0.8em">${item.eff}</td><td>${item.mat}</td><td>${item.rar}</td></tr>`;
        }
    });
    document.getElementById('tabla-todos-objetos').innerHTML = html + "</table>";
}

export function dibujarControl() {
    let html = "<h2>OP</h2><div style='text-align:center'>";
    Object.keys(invGlobal).sort().forEach(j => html += `<button onclick="window.setCtrl('${j}')">${j}</button> `);
    html += "</div>";
    if (estadoUI.jugadorControl) {
        const j = estadoUI.jugadorControl;
        html += `<div class="grid-control">`;
        ordenarItems(j).forEach(o => {
            const c = invGlobal[j][o] || 0;
            const bg = c > 0 ? "item-con-stock" : "";
            html += `<div class="control-card ${bg}"><span class="item-name">${o} (<b>${c}</b>)</span>
                <div class="item-btns"><button onclick="window.hexMod('${j}','${o}',1)">+1</button><button onclick="window.hexMod('${j}','${o}',5)">+5</button>
                <button class="btn-neg" onclick="window.hexMod('${j}','${o}',-1)">-1</button><button class="btn-neg" onclick="window.hexMod('${j}','${o}',-5)">-5</button></div></div>`;
        });
        html += "</div>";
    }
    document.getElementById('panel-interactivo').innerHTML = html;
}

