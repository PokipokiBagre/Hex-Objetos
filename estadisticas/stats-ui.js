import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularBonos } from './stats-logic.js';

export function dibujarUIStats() {
    dibujarSelector(); // Esto garantiza que los botones de personajes aparezcan
    const dashboard = document.getElementById('dashboard-stats');
    
    if (!estadoUI.jugadorActivo) { 
        dashboard.innerHTML = `
            <div class="stat-card" style="text-align:center; padding:50px; opacity:0.5;">
                <h3>SISTEMA HEX</h3>
                <p>SELECCIONA UN PERSONAJE ARRIBA PARA VER SU ESTADO.</p>
            </div>`; 
        return; 
    }

    const j = estadoUI.jugadorActivo;
    const s = statsGlobal[j];
    const bonos = calcularBonos(j);

    const rojaPartes = s.vida.roja.split('/');
    const rojaActual = parseInt(rojaPartes[0]) || 0;
    const rojaTotalMax = (parseInt(rojaPartes[1]) || 10) + bonos.bonoRoja;

    dashboard.innerHTML = `
        <div class="stat-card">
            <div style="display:flex; align-items:center; gap:25px; border-bottom:1px solid #d4af3744; padding-bottom:20px; margin-bottom:25px;">
                <img src="../img/imgpersonajes/${j.toLowerCase()}icon.png" style="width:110px; height:110px; border:2px solid #d4af37; border-radius:50%; object-fit:cover;" onerror="this.src='../img/icon.png'">
                <div style="text-align:left;">
                    <h2 style="margin:0; text-align:left; color:#d4af37; font-size:1.6em;">${s.nombreFull}</h2>
                    <p style="font-size:0.85em; color:#ddd; margin-top:8px;">${s.bio}</p>
                </div>
            </div>

            <div class="resource-grid">
                <div>
                    <label style="font-size:0.7em; color:#ff4d4d; font-weight:bold;">VITALIDAD ROJA (+${bonos.bonoRoja} por Física)</label>
                    <div class="bar-container"><div class="bar-fill bar-red" style="width:${(rojaActual/rojaTotalMax)*100}%"></div><div class="bar-text">${rojaActual} / ${rojaTotalMax} ❤️</div></div>
                    
                    <label style="font-size:0.7em; color:#00bfff; font-weight:bold;">VITALIDAD AZUL (+${bonos.bonoAzul} por Mágicas)</label>
                    <div class="bar-container"><div class="bar-fill bar-blue" style="width:${(s.vida.azul/15)*100}%"></div><div class="bar-text">${s.vida.azul} Corazones 💙</div></div>
                </div>
                <div>
                    <label style="font-size:0.7em; color:#9932cc; font-weight:bold;">HEX ACTUAL</label>
                    <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${s.hex} HEX</div></div>

                    <label style="font-size:0.7em; color:#32cd32; font-weight:bold;">VEX (Oscura +${bonos.bonoVex})</label>
                    <div class="bar-container"><div class="bar-fill bar-green" style="width:${(s.vex/(2000 + bonos.bonoVex))*100}%"></div><div class="bar-text">${s.vex} / ${2000 + bonos.bonoVex} VEX</div></div>
                </div>
            </div>

            <div class="afin-grid">
                ${Object.entries(s.afin).map(([key, val]) => `
                    <div class="afin-box">
                        <label>${key.toUpperCase()}</label>
                        <span>${val}</span>
                    </div>
                `).join('')}
            </div>

            <h3>HECHIZOS APRENDIDOS</h3>
            <div class="table-responsive">
                <table class="spell-table">
                    <tr><th>Afinidad</th><th>Hechizo</th><th>Gasto Hex</th></tr>
                    ${s.learnedSpells.map(h => `<tr><td style="color:#d4af37; font-weight:bold;">${h.afinidad}</td><td>${h.nombre}</td><td>${h.costo}</td></tr>`).join('')}
                </table>
            </div>
        </div>
    `;
}

function dibujarSelector() {
    const container = document.getElementById('selector-jugadores');
    const personajes = Object.keys(statsGlobal).sort();
    
    container.innerHTML = `<div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px; flex-wrap:wrap;">` + 
        personajes.map(j => `
            <button onclick="window.setJugadorStats('${j}')" class="${estadoUI.jugadorActivo === j ? 'btn-active' : ''}">${j.toUpperCase()}</button>
        `).join(' ') + `</div>`;
}

export function dibujarAdminStats() {
    const dashboard = document.getElementById('panel-op-stats');
    const j = estadoUI.jugadorActivo;
    if (!j) { dashboard.innerHTML = "<h2>EDITOR OP</h2><p>Selecciona un jugador arriba.</p>"; return; }

    dashboard.innerHTML = `
        <h2>EDITOR OP: ${j}</h2>
        <div class="stat-card" style="max-width:650px; margin:0 auto;">
            <button onclick="window.descargarCSVStats()" style="width:100%; margin-bottom:10px; background:#d4af37; color:#000; font-weight:bold;">DESCARGAR CSV ACTUALIZADO</button>
            <button onclick="window.setPage('publico')" style="width:100%; background:#333;">CERRAR PANEL</button>
        </div>
    `;
}

