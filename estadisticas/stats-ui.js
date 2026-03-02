import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularTodo, generarLineaCSV } from './stats-logic.js';

export function dibujarUIStats() {
    dibujarSelector();
    const dashboard = document.getElementById('dashboard-stats');
    if (!estadoUI.jugadorActivo) { 
        dashboard.innerHTML = "<p style='text-align:center; opacity:0.5;'>Selecciona un personaje arriba.</p>"; 
        return; 
    }

    const j = estadoUI.jugadorActivo;
    const s = statsGlobal[j];
    const bonos = calcularBonos(j);

    const rojaPartes = s.vida.roja.split('/');
    const rojaActual = parseInt(rojaPartes[0]) || 0;
    const rojaMaxBase = parseInt(rojaPartes[1]) || 10;
    const rojaTotalMax = rojaMaxBase + bonos.bonoRoja;

    dashboard.innerHTML = `
        <div class="stat-card">
            <div style="display:flex; align-items:center; gap:20px; border-bottom:1px solid #d4af37; padding-bottom:15px; margin-bottom:20px;">
                <img src="../img/imgpersonajes/${j.toLowerCase()}icon.png" style="width:100px; height:100px; border:2px solid #d4af37; border-radius:50%;" onerror="this.src='../img/icon.png'">
                <div style="text-align:left;">
                    <h2 style="margin:0; text-align:left;">${s.nombreFull}</h2>
                    <p style="font-size:0.85em; color:#aaa; margin:5px 0;">${s.bio}</p>
                </div>
            </div>

            <div class="resource-grid">
                <div>
                    <label style="font-size:0.7em; color:#ff4d4d;">VITALIDAD ROJA (+${bonos.bonoRoja} por Física)</label>
                    <div class="bar-container"><div class="bar-fill bar-red" style="width:${(rojaActual/rojaTotalMax)*100}%"></div><div class="bar-text">${rojaActual} / ${rojaTotalMax} ❤️</div></div>
                    <label style="font-size:0.7em; color:#00bfff;">VITALIDAD AZUL (+${bonos.bonoAzul} por Mágicas)</label>
                    <div class="bar-container"><div class="bar-fill bar-blue" style="width:${(s.vida.azul/20)*100}%"></div><div class="bar-text">${s.vida.azul} Corazones 💙</div></div>
                </div>
                <div>
                    <label style="font-size:0.7em; color:#9932cc;">HEX ACTUAL</label>
                    <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${s.hex} HEX</div></div>
                    <label style="font-size:0.7em; color:#32cd32;">VEX (CAPACIDAD +${bonos.bonoVex})</label>
                    <div class="bar-container"><div class="bar-fill bar-green" style="width:100%"></div><div class="bar-text">${s.vex} / ${2000 + bonos.bonoVex} VEX</div></div>
                </div>
            </div>

            <div class="afin-grid">
                <div class="afin-box"><label>FÍSICA</label><span>${s.afin.fis}</span></div>
                <div class="afin-box"><label>ENERGÉTICA</label><span>${s.afin.ene}</span></div>
                <div class="afin-box"><label>ESPIRITUAL</label><span>${s.afin.esp}</span></div>
                <div class="afin-box"><label>MANDO</label><span>${s.afin.man}</span></div>
                <div class="afin-box"><label>PSÍQUICA</label><span>${s.afin.psi}</span></div>
                <div class="afin-box"><label>OSCURA</label><span>${s.afin.osc}</span></div>
            </div>

            <h3>HECHIZOS APRENDIDOS</h3>
            <div class="table-responsive">
                <table class="spell-table">
                    <tr><th>Afinidad</th><th>Nombre del Hechizo</th><th>Costo Hex</th></tr>
                    ${s.learnedSpells.map(h => `<tr><td style="color:#d4af37">${h.afinidad}</td><td>${h.nombre}</td><td>${h.costo}</td></tr>`).join('')}
                </table>
            </div>
        </div>
    `;
}

function dibujarSelector() {
    const container = document.getElementById('selector-jugadores');
    container.innerHTML = Object.keys(statsGlobal).sort().map(j => `
        <button onclick="window.setJugadorStats('${j}')" class="${estadoUI.jugadorActivo === j ? 'btn-active' : ''}">${j}</button>
    `).join(' ');
}

export function dibujarAdminStats() {
    const dashboard = document.getElementById('panel-op-stats');
    const j = estadoUI.jugadorActivo;
    if (!j) { dashboard.innerHTML = "<h2>Editor OP</h2><p>Selecciona un jugador primero.</p>"; return; }

    dashboard.innerHTML = `
        <h2>Editor OP: ${j}</h2>
        <div class="stat-card" style="max-width:600px; margin:0 auto;">
            <button onclick="window.descargarCSVStats()" style="width:100%; margin-bottom:10px; background:#d4af37; color:#000;">DESCARGAR CSV</button>
            <button onclick="window.setPage('publico')" style="width:100%; background:#444;">CERRAR</button>
        </div>
    `;
}

export function refrescarUI() {
    const container = document.getElementById('contenedor-catalog');
    if(!container) return;

    const ids = Object.keys(statsGlobal).sort((a, b) => {
        const pA = estadoUI.principales.includes(a) ? 0 : 1;
        const pB = estadoUI.principales.includes(b) ? 0 : 1;
        return pA - pB || a.localeCompare(b);
    });

    container.innerHTML = ids.map(id => {
        const d = calcularTodo(id);
        const img = `../img/imgpersonajes/${id.toLowerCase()}icon.png`;
        return `
            <div class="personaje-card">
                <div class="header-card">
                    <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                    <span style="color:#d4af37; font-weight:bold;">${id.toUpperCase()}</span>
                    ${estadoUI.principales.includes(id) ? '<small style="color:#0f0;">PROPRIETARIO</small>' : ''}
                </div>
                <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.roja/d.rojaMax)*100}%"></div><div class="bar-text">${d.roja}/${d.rojaMax} ❤️</div></div>
                <div class="bar-container"><div class="bar-fill bar-blue" style="width:100%"></div><div class="bar-text">${d.azul} 💙</div></div>
                <div class="afin-grid">
                    ${['FIS','ENE','ESP','MAN','PSI','OSC'].map((n, i) => `<div class="afin-box"><label>${n}</label><span>${d.afin[i]}</span></div>`).join('')}
                </div>
            </div>
        `;
    }).join('');
}

export function dibujarDisenador() {
    document.getElementById('panel-op-stats').innerHTML = `
        <div class="personaje-card" style="max-width:500px; margin: 0 auto;">
            <h2>DISEÑADOR DE PERSONAJE</h2>
            <input type="text" id="new-id" placeholder="ID (Ej: Corvin)" style="width:90%; margin:10px; padding:8px;">
            <input type="text" id="new-nom" placeholder="Nombre Completo" style="width:90%; margin:10px; padding:8px;">
            <textarea id="new-bio" placeholder="Biografía corta..." style="width:90%; margin:10px; height:60px;"></textarea>
            <button onclick="window.crearPersonaje()" style="width:100%; background:#006400; margin-top:10px;">GENERAR CSV</button>
            <button onclick="window.mostrarPagina('publico')" style="width:100%; margin-top:5px; background:#444;">CANCELAR</button>
        </div>
    `;
}

