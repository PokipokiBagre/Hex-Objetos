import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularFicha } from './stats-logic.js';

export function refrescarUI() {
    const catalog = document.getElementById('contenedor-catalog');
    const dash = document.getElementById('dashboard-stats');
    if(!catalog) return;

    if(estadoUI.personajeActivo) {
        catalog.style.display = "none";
        dibujarDetalle(estadoUI.personajeActivo, dash);
    } else {
        catalog.style.display = "grid";
        dash.innerHTML = "";
        dibujarCatalogo(catalog);
    }
}

function dibujarCatalogo(container) {
    const ids = Object.keys(statsGlobal).sort((a, b) => {
        const pA = estadoUI.principales.includes(a) ? 0 : 1;
        const pB = estadoUI.principales.includes(b) ? 0 : 1;
        return pA - pB || a.localeCompare(b);
    });

    container.innerHTML = ids.map(id => {
        const d = calcularFicha(id);
        return `
            <div class="personaje-card" onclick="window.setActivo('${id}')">
                <img src="../img/imgpersonajes/${id.toLowerCase()}icon.png" class="img-p" onerror="this.src='../img/icon.png'">
                <div style="color:#d4af37; font-weight:bold; font-size:1.1em;">${id.toUpperCase()}</div>
                <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.roja/d.rojaMax)*100}%"></div><div class="bar-text">${d.roja}/${d.rojaMax} ❤️</div></div>
                ${estadoUI.principales.includes(id) ? '<small style="color:#0f0; letter-spacing:1px;">PROPIETARIO</small>' : ''}
            </div>`;
    }).join('');
}

function dibujarDetalle(id, container) {
    const d = calcularFicha(id);
    container.innerHTML = `
        <div class="stat-card" style="text-align:left;">
            <button onclick="window.setActivo(null)" style="float:right;">CERRAR</button>
            <h2 style="color:#d4af37;">${id}</h2>
            <div class="resource-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div>
                    <label style="color:#ff4d4d; font-size:0.7em;">ESTADO FÍSICO (RAD)</label>
                    <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.roja/d.rojaMax)*100}%"></div><div class="bar-text">${d.roja} / ${d.rojaMax} ❤️</div></div>
                    <div class="bar-container"><div class="bar-fill bar-blue" style="width:100%"></div><div class="bar-text">${d.azul} Azules</div></div>
                </div>
                <div>
                    <label style="color:#9932cc; font-size:0.7em;">ESTADO MÁGICO</label>
                    <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${d.hex} HEX</div></div>
                    <div class="bar-container"><div class="bar-fill bar-green" style="width:${(d.vexActual/d.vexMax)*100}%"></div><div class="bar-text">${d.vexActual} / ${d.vexMax} VEX</div></div>
                </div>
            </div>
            <div class="afin-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin:20px 0;">
                ${Object.entries(d.afin).map(([k,v])=>`<div class="afin-box" style="background:rgba(0,0,0,0.4); padding:10px; border-radius:5px; text-align:center;"><label style="font-size:0.6em; color:#aaa; display:block;">${k.toUpperCase()}</label><span style="color:#d4af37; font-weight:bold;">${v}</span></div>`).join('')}
            </div>
            <h3 style="color:#d4af37;">HECHIZOS APRENDIDOS (${d.spells.length})</h3>
            <table class="spell-table" style="width:100%; border-collapse:collapse;">
                ${d.spells.map(s => `<tr style="border-bottom:1px solid #d4af3722;"><td>${s.afin}</td><td>${s.nom}</td><td style="color:#d4af37;">${s.hex}</td></tr>`).join('')}
            </table>
        </div>`;
}

export function dibujarDisenador() {
    document.getElementById('panel-op-central').innerHTML = `
        <div class="stat-card" style="max-width:800px; margin:auto; text-align:left;">
            <h2 style="text-align:center;">DISEÑADOR DE PERSONAJE (A-S)</h2>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px;">
                <input type="text" id="new-id" placeholder="ID (Linda)" class="op-input">
                <input type="number" id="new-hex" placeholder="HEX Base">
                <input type="number" id="new-vex" placeholder="VEX Base">
                <input type="number" id="new-fis" placeholder="Física">
                <input type="number" id="new-ene" placeholder="Energía">
                <input type="number" id="new-esp" placeholder="Espíritu">
                <input type="number" id="new-man" placeholder="Mando">
                <input type="number" id="new-psi" placeholder="Psique">
                <input type="number" id="new-osc" placeholder="Oscura">
                <input type="number" id="new-rA" placeholder="Rojo Act">
                <input type="number" id="new-rM" placeholder="Rojo MaxBase" value="10">
                <input type="number" id="new-aA" placeholder="Azul Act">
                <input type="number" id="new-go" placeholder="Oro">
            </div>
            <textarea id="new-spells" placeholder="Lista Hechizos (Copia y pega de R)..." style="width:98%; height:60px; margin-top:15px; background:#000; color:#fff; border:1px solid #d4af37;"></textarea>
            <button onclick="window.generarNuevoPersonaje()" style="width:100%; background:#006400; margin-top:20px;">GENERAR LÍNEA CSV</button>
            <button onclick="window.mostrarPagina('publico')" style="width:100%; background:#444; margin-top:10px;">CANCELAR</button>
        </div>`;
}
