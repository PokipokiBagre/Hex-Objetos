import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularBonos } from './stats-logic.js';

function drawnHEXPreserveFocus(containerId, html) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = html;
}

export function refrescarUI() {
    dibujarBotonesJugadores();
    dibujarFichaPrincipal();
    if (estadoUI.esAdmin) dibujarAdminStats();
}

function dibujarBotonesJugadores() {
    let html = `<div class="filter-group" style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:30px;">`;
    Object.keys(statsGlobal).sort().forEach(j => {
        const active = estadoUI.jugadorActivo === j ? 'class="btn-active"' : '';
        html += `<button onclick="window.setJugadorStats('${j}')" ${active}>${j.toUpperCase()}</button> `;
    });
    drawnHEXPreserveFocus('contenedor-jugadores', html + "</div>");
}

function dibujarFichaPrincipal() {
    const dashboard = document.getElementById('dashboard-stats');
    if (!estadoUI.jugadorActivo) {
        dashboard.innerHTML = `<div class="stat-card" style="text-align:center; padding:50px; opacity:0.5;"><h3>SISTEMA HEX</h3><p>SELECCIONA UN JUGADOR PARA VER SU ESTADO.</p></div>`;
        return;
    }

    const j = estadoUI.jugadorActivo;
    const s = statsGlobal[j];
    const bonos = calcularBonos(j);
    const rojaTotalMax = (parseInt(s.vida.roja.split('/')[1]) || 10) + bonos.bonoRoja;

    dashboard.innerHTML = `
        <div class="stat-card">
            <div class="player-header" style="display:flex; align-items:center; gap:25px; border-bottom:1px solid #d4af3744; padding-bottom:20px;">
                <img src="../img/imgpersonajes/${j.toLowerCase()}icon.png" class="player-icon" style="width:100px; height:100px; border-radius:50%; border:2px solid #d4af37;" onerror="this.src='../img/icon.png'">
                <div style="text-align:left;">
                    <h2 style="margin:0; color:#d4af37;">${s.nombreFull}</h2>
                    <p style="font-size:0.85em; color:#ddd;">${s.bio}</p>
                </div>
            </div>
            <div class="resource-grid" style="margin-top:20px;">
                <div class="bar-container"><div class="bar-fill bar-red" style="width:${(parseInt(s.vida.roja)/rojaTotalMax)*100}%"></div><div class="bar-text">${s.vida.roja.split('/')[0]} / ${rojaTotalMax} ❤️</div></div>
                <div class="bar-container"><div class="bar-fill bar-blue" style="width:${(s.vida.azul/15)*100}%"></div><div class="bar-text">${s.vida.azul} Corazones 💙</div></div>
            </div>
        </div>`;
}

export function dibujarAdminStats() {
    const target = document.getElementById('panel-op-stats');
    if (!target) return;
    target.innerHTML = `<h2>EDITOR OP: ${estadoUI.jugadorActivo || '---'}</h2>
        <div class="stat-card"><button onclick="window.descargarCSVStats()" style="width:100%; background:#d4af37; color:#000;">DESCARGAR CSV</button></div>`;
}
