import { statsGlobal, estadoUI } from './stat-state.js';
import { calcularBonos } from './stat-logic.js';

export function dibujarUIStats() {
    dibujarSelector();
    const dashboard = document.getElementById('dashboard-stats');
    if (!estadoUI.jugadorActivo) { 
        dashboard.innerHTML = "<div class='stat-card' style='text-align:center; padding:50px; opacity:0.6;'><h3>SISTEMA HEX - ARCHIVOS DE ESTADO</h3><p>Selecciona un personaje arriba para desplegar su ficha de combate y progresión.</p></div>"; 
        return; 
    }

    const j = estadoUI.jugadorActivo;
    const s = statsGlobal[j];
    const bonos = calcularBonos(j);

    // Vida Roja
    const rojaPartes = s.vida.roja.split('/');
    const rojaActual = parseInt(rojaPartes[0]) || 0;
    const rojaMaxBase = parseInt(rojaPartes[1]) || 10;
    const rojaTotalMax = rojaMaxBase + bonos.bonoRoja;

    // Vex Máximo
    const vexMaxTotal = 2000 + bonos.bonoVex;

    dashboard.innerHTML = `
        <div class="stat-card">
            <div style="display:flex; align-items:center; gap:25px; border-bottom:1px solid #d4af3744; padding-bottom:20px; margin-bottom:25px;">
                <img src="../img/imgpersonajes/${j.toLowerCase()}icon.png" style="width:110px; height:110px; border:2px solid #d4af37; border-radius:50%; object-fit:cover;" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                <div style="text-align:left;">
                    <h2 style="margin:0; text-align:left; font-size:1.8em; color:#d4af37;">${s.nombreFull}</h2>
                    <p style="font-size:0.9em; color:#ddd; line-height:1.4; margin-top:8px;">${s.bio}</p>
                </div>
            </div>

            <div class="resource-grid">
                <div>
                    <label style="font-size:0.75em; color:#ff4d4d; font-weight:bold;">VITALIDAD ROJA (Física +${bonos.bonoRoja})</label>
                    <div class="bar-container"><div class="bar-fill bar-red" style="width:${(rojaActual/rojaTotalMax)*100}%"></div><div class="bar-text">${rojaActual} / ${rojaTotalMax} ❤️</div></div>
                    
                    <label style="font-size:0.75em; color:#00bfff; font-weight:bold;">VITALIDAD AZUL (Mágicas +${bonos.bonoAzul})</label>
                    <div class="bar-container"><div class="bar-fill bar-blue" style="width:${(s.vida.azul/15)*100}%"></div><div class="bar-text">${s.vida.azul} Corazones 💙</div></div>
                </div>
                <div>
                    <label style="font-size:0.75em; color:#9932cc; font-weight:bold;">HEX ACTUAL</label>
                    <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${s.hex} HEX</div></div>

                    <label style="font-size:0.75em; color:#32cd32; font-weight:bold;">VEX (Oscura +${bonos.bonoVex})</label>
                    <div class="bar-container"><div class="bar-fill bar-green" style="width:${(s.vex/vexMaxTotal)*100}%"></div><div class="bar-text">${s.vex} / ${vexMaxTotal} VEX</div></div>
                </div>
            </div>

            <h3>AFINIDADES</h3>
            <div class="afin-grid">
                <div class="afin-box"><label>FÍSICA</label><span>${s.afin.fis}</span></div>
                <div class="afin-box"><label>ENERGÉTICA</label><span>${s.afin.ene}</span></div>
                <div class="afin-box"><label>ESPIRITUAL</label><span>${s.afin.esp}</span></div>
                <div class="afin-box"><label>MANDO</label><span>${s.afin.man}</span></div>
                <div class="afin-box"><label>PSÍQUICA</label><span>${s.afin.psi}</span></div>
                <div class="afin-box"><label>OSCURA</label><span>${s.afin.osc}</span></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px;">
                <h3 style="margin:0;">HECHIZOS APRENDIDOS</h3>
                <span style="color:#aaa; font-size:0.8em;">Total: ${s.learnedSpells.length}</span>
            </div>
            <div class="table-responsive" style="margin-top:15px;">
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
    // Genera los botones de los personajes cargados
    container.innerHTML = Object.keys(statsGlobal).sort().map(j => `
        <button onclick="window.setJugadorStats('${j}')" class="${estadoUI.jugadorActivo === j ? 'btn-active' : ''}">${j}</button>
    `).join(' ');
}

export function dibujarAdminStats() {
    const dashboard = document.getElementById('panel-op-stats');
    const j = estadoUI.jugadorActivo;
    if (!j) { dashboard.innerHTML = "<h2 style='margin-top:100px;'>EDITOR OP</h2><p style='text-align:center;'>Selecciona un jugador arriba para editar sus stats.</p>"; return; }

    dashboard.innerHTML = `
        <h2>EDITOR OP: ${j}</h2>
        <div class="stat-card" style="max-width:650px; margin:0 auto;">
            <h3>Añadir Hechizo Manual</h3>
            <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:10px; margin-bottom:20px;">
                <input type="text" id="add-spell-name" placeholder="Nombre..." style="padding:12px; background:#120024; color:white; border:1px solid #d4af37;">
                <input type="text" id="add-spell-afin" placeholder="Afinidad" style="padding:12px; background:#120024; color:white; border:1px solid #d4af37;">
                <input type="number" id="add-spell-hex" placeholder="Hex" style="padding:12px; background:#120024; color:white; border:1px solid #d4af37;">
            </div>
            <button onclick="window.addHechizoAdmin()" style="width:100%; margin-bottom:20px; background:#4a004a;">REGISTRAR APRENDIZAJE</button>
            <hr style="border:0; border-top:1px solid #d4af3733; margin:20px 0;">
            <button onclick="window.descargarCSVStats()" style="width:100%; margin-bottom:10px; background:#d4af37; color:#000;">DESCARGAR CSV DE ESTADO</button>
            <button onclick="window.setPage('publico')" style="width:100%; background:#333;">CERRAR PANEL</button>
        </div>
    `;
}
