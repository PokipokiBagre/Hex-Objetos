import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularFichaCompleta } from './stats-logic.js';

export function refrescarUI() {
    const catalog = document.getElementById('contenedor-catalog');
    const tableDiv = document.getElementById('contenedor-tabla');
    const dash = document.getElementById('dashboard-stats');
    if(!catalog) return;

    if(estadoUI.personajeActivo) {
        catalog.style.display = "none";
        tableDiv.style.display = "none";
        dibujarDetalle(estadoUI.personajeActivo, dash);
    } else {
        catalog.style.display = "grid";
        tableDiv.style.display = "block";
        dash.innerHTML = "";
        dibujarCatalogo(catalog);
        dibujarTablaDatos(tableDiv);
    }
}

function dibujarCatalogo(container) {
    container.innerHTML = Object.keys(statsGlobal).sort().map(id => {
        const d = calcularFichaCompleta(id);
        const img = `../img/imgpersonajes/${id.toLowerCase()}icon.png`;
        return `
            <div class="personaje-card" onclick="window.setActivo('${id}')">
                <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                <div style="font-weight:bold; color:#d4af37; font-size:1.1em; letter-spacing:1px;">${id.toUpperCase()}</div>
                <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${d.hex} HEX</div></div>
                <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.roja/d.rojaMax)*100}%"></div><div class="bar-text">${d.roja}/${d.rojaMax} ❤️</div></div>
            </div>`;
    }).join('');
}

function dibujarTablaDatos(container) {
    let html = `<div class="raw-table-container"><h3>DATOS DEL SISTEMA (A-P)</h3><table class="raw-table">
        <tr><th>ID</th><th>HEX</th><th>VEX</th><th>FIS</th><th>ENE</th><th>ESP</th><th>MAN</th><th>PSI</th><th>OSC</th><th>R</th><th>RM</th><th>A</th><th>O</th><th>DR</th><th>DA</th><th>EO</th></tr>`;
    
    Object.keys(statsGlobal).sort().forEach(id => {
        const p = statsGlobal[id];
        html += `<tr>
            <td style="color:#d4af37; font-weight:bold;">${p.id}</td>
            <td>${p.hex}</td><td>${p.vex}</td><td>${p.afin.fis}</td><td>${p.afin.ene}</td><td>${p.afin.esp}</td><td>${p.afin.man}</td><td>${p.afin.psi}</td><td>${p.afin.osc}</td>
            <td>${p.vida.actual}</td><td>${p.vida.maxBase}</td><td>${p.vida.azul}</td><td>${p.vida.oro}</td>
            <td>${p.rad.dRoja}</td><td>${p.rad.dAzul}</td><td>${p.rad.eOro}</td>
        </tr>`;
    });
    container.innerHTML = html + `</table></div>`;
}

function dibujarDetalle(id, container) {
    const d = calcularFichaCompleta(id);
    container.innerHTML = `
        <div class="stat-card" style="text-align:left; animation: fadeIn 0.5s;">
            <button onclick="window.setActivo(null)" style="float:right; background:#444;">CERRAR</button>
            <h2 style="color:#d4af37; margin-top:0;">${id}</h2>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px;">
                <div>
                    <label style="color:#ff4d4d; font-size:0.7em;">ESTADO RAD</label>
                    <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.roja/d.rojaMax)*100}%"></div><div class="bar-text">${d.roja} / ${d.rojaMax} ❤️</div></div>
                    <div class="bar-container"><div class="bar-fill bar-blue" style="width:100%"></div><div class="bar-text">${d.azul} Corazones Azules</div></div>
                </div>
                <div>
                    <label style="color:#9932cc; font-size:0.7em;">ESTADO MÁGICO</label>
                    <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${d.hex} HEX</div></div>
                    <div class="bar-container"><div class="bar-fill bar-green" style="width:${(d.vexActual/d.vexMax)*100}%"></div><div class="bar-text">${d.vexActual} / ${d.vexMax} VEX</div></div>
                </div>
            </div>
            <div class="afin-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin:20px 0;">
                ${Object.entries(d.afin).map(([k,v])=>`<div class="afin-box" style="background:rgba(0,0,0,0.4); padding:10px; text-align:center;"><label style="font-size:0.6em; color:#aaa; display:block;">${k.toUpperCase()}</label><span style="color:#d4af37; font-weight:bold;">${v}</span></div>`).join('')}
            </div>
            <h3 style="color:#d4af37; border-bottom:1px solid #d4af3733; padding-bottom:5px;">HECHIZOS APRENDIDOS (${d.hechizos.length})</h3>
            <div style="max-height:300px; overflow-y:auto;">
                <table style="width:100%; border-collapse:collapse;">
                    ${d.hechizos.map(h => `<tr style="border-bottom:1px solid #d4af3711;"><td style="padding:8px;">${h.afinidad}</td><td style="padding:8px;">${h.nombre}</td><td style="padding:8px; color:#d4af37;">${h.costo}</td></tr>`).join('')}
                </table>
            </div>
        </div>`;
}

export function dibujarDiseñador() {
    document.getElementById('panel-op-central').innerHTML = `
        <div class="stat-card" style="max-width:900px; margin:auto;">
            <h2>DISEÑADOR DE PERSONAJE (A-S)</h2>
            <div class="designer-form">
                <div><label>ID</label><input id="n-id" placeholder="Linda"></div>
                <div><label>HEX</label><input id="n-hx" type="number" value="0"></div>
                <div><label>VEX</label><input id="n-vx" type="number" value="0"></div>
                <div><label>Física</label><input id="n-fi" type="number" value="0"></div>
                <div><label>Energía</label><input id="n-en" type="number" value="0"></div>
                <div><label>Espíritu</label><input id="n-es" type="number" value="0"></div>
                <div><label>Mando</label><input id="n-ma" type="number" value="0"></div>
                <div><label>Psique</label><input id="n-ps" type="number" value="0"></div>
                <div><label>Oscura</label><input id="n-os" type="number" value="0"></div>
                <div><label>Rojo Act</label><input id="n-ra" type="number" value="0"></div>
                <div><label>Rojo MaxBase</label><input id="n-rm" type="number" value="10"></div>
                <div><label>Azul Act</label><input id="n-aa" type="number" value="0"></div>
                <div><label>Oro Act</label><input id="n-go" type="number" value="0"></div>
                <div><label>D-Rojo</label><input id="n-dr" type="number" value="0"></div>
                <div><label>D-Azul</label><input id="n-da" type="number" value="0"></div>
                <div style="grid-column: span 3;"><label>Lista Hechizos (Copia y pega de R)</label><textarea id="n-sp" style="height:60px;"></textarea></div>
            </div>
            <button onclick="window.agregarManual()" style="width:100%; background:#006400; margin-top:20px; color:white;">AGREGAR A PERSONAJES</button>
            <button onclick="window.descargarFila()" style="width:100%; background:#d4af37; margin-top:5px; color:black;">DESCARGAR CSV</button>
            <button onclick="window.mostrarPagina('publico')" style="width:100%; background:#444; margin-top:5px;">CANCELAR</button>
        </div>`;
}
