import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularBonos } from './stats-logic.js';

export function dibujarUIStats() {
    dibujarBotonesJugadores(); // Reemplaza al antiguo selector
    
    const dashboard = document.getElementById('dashboard-stats');
    if (!estadoUI.jugadorActivo) { 
        dashboard.innerHTML = `
            <div class="stat-card" style="text-align:center; padding:50px; opacity:0.5;">
                <h3>SISTEMA HEX</h3>
                <p>SELECCIONA UN PERSONAJE PARA VER SU ESTADO.</p>
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
            <div class="player-header">
                <img src="../img/imgpersonajes/${j.toLowerCase()}icon.png" class="player-icon" onerror="this.src='../img/icon.png'">
                <div style="text-align:left;">
                    <h2 style="margin:0; color:#d4af37;">${s.nombreFull}</h2>
                    <p style="font-size:0.85em; color:#ddd;">${s.bio}</p>
                </div>
            </div>

            <div class="resource-grid">
                <div>
                    <label style="color:#ff4d4d;">VITALIDAD ROJA (+${bonos.bonoRoja})</label>
                    <div class="bar-container"><div class="bar-fill bar-red" style="width:${(rojaActual/rojaTotalMax)*100}%"></div><div class="bar-text">${rojaActual} / ${rojaTotalMax} ❤️</div></div>
                    
                    <label style="color:#00bfff;">VITALIDAD AZUL (+${bonos.bonoAzul})</label>
                    <div class="bar-container"><div class="bar-fill bar-blue" style="width:${(s.vida.azul/15)*100}%"></div><div class="bar-text">${s.vida.azul} 💙</div></div>
                </div>
                <div>
                    <label style="color:#9932cc;">HEX ACTUAL</label>
                    <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${s.hex} HEX</div></div>

                    <label style="color:#32cd32;">VEX (+${bonos.bonoVex})</label>
                    <div class="bar-container"><div class="bar-fill bar-green" style="width:${(s.vex/(2000 + bonos.bonoVex))*100}%"></div><div class="bar-text">${s.vex} / ${2000 + bonos.bonoVex}</div></div>
                </div>
            </div>

            <div class="afin-grid">
                ${Object.entries(s.afin).map(([key, val]) => `
                    <div class="afin-box"><label>${key.toUpperCase()}</label><span>${val}</span></div>
                `).join('')}
            </div>
        </div>
    `;
}

// NUEVA FUNCIÓN: Genera los botones exactos como en Objetos
function dibujarBotonesJugadores() {
    const container = document.getElementById('selector-jugadores');
    if (!container) return;

    const personajes = Object.keys(statsGlobal).sort();
    
    // Título igual que en la imagen de Inventarios
    let html = `<h3 style="color:#d4af37; text-align:center; font-size:0.9em; margin-bottom:15px; letter-spacing:2px;">JUGADORES</h3>`;
    html += `<div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:30px;">`;
    
    html += personajes.map(j => `
        <button onclick="window.setJugadorStats('${j}')" 
                style="min-width:100px;"
                class="${estadoUI.jugadorActivo === j ? 'btn-active' : ''}">
            ${j.toUpperCase()}
        </button>
    `).join('');
    
    html += `</div>`;
    container.innerHTML = html;
}
export function dibujarAdminStats() {
    const dashboard = document.getElementById('panel-op-stats');
    const j = estadoUI.jugadorActivo;
    if (!j) { dashboard.innerHTML = "<h2>EDITOR OP</h2><p>Selecciona un jugador primero.</p>"; return; }

    dashboard.innerHTML = `
        <h2>EDITOR OP: ${j}</h2>
        <div class="stat-card" style="max-width:650px; margin:0 auto;">
            <button onclick="window.descargarCSVStats()" style="width:100%; margin-bottom:10px; background:#d4af37; color:#000; font-weight:bold;">DESCARGAR CSV</button>
            <button onclick="window.setPage('publico')" style="width:100%; background:#333;">CERRAR</button>
        </div>
    `;
}


