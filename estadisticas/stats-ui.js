import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularTodo } from './stats-logic.js';

function drawnHEXPreserveFocus(containerId, html) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = html;
}

export function refrescarUI() {
    dibujarCatalogo();
    if (estadoUI.esAdmin) dibujarAdmin();
}

function dibujarCatalogo() {
    const container = document.getElementById('contenedor-catalog');
    if (!container) return;

    // Prioridad: Principales primero
    const ids = Object.keys(statsGlobal).sort((a, b) => {
        const pA = estadoUI.principales.includes(a) ? 0 : 1;
        const pB = estadoUI.principales.includes(b) ? 0 : 1;
        return pA - pB || a.localeCompare(b);
    });

    let html = "";
    ids.forEach(id => {
        const d = calcularTodo(id);
        const img = `../img/imgpersonajes/${id.toLowerCase()}icon.png`;
        
        html += `
            <div class="personaje-card">
                <div class="header-card">
                    <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                    <span style="color:#d4af37; font-weight:bold;">${id.toUpperCase()}</span>
                    ${estadoUI.principales.includes(id) ? '<small style="color:#0f0; display:block; font-size:0.6em;">PRINCIPAL</small>' : ''}
                </div>
                
                <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.roja/d.rojaMax)*100}%"></div><div class="bar-text">${d.roja} / ${d.rojaMax} ❤️</div></div>
                <div class="bar-container"><div class="bar-fill bar-blue" style="width:100%"></div><div class="bar-text">${d.azul} Corazones 💙</div></div>
                
                <div class="afin-grid">
                    ${['FIS','ENE','ESP','MAN','PSI','OSC'].map((n, i) => `
                        <div class="afin-box"><label>${n}</label><span>${d.afin[i]}</span></div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    drawnHEXPreserveFocus('contenedor-catalog', html);
}

function dibujarAdmin() {
    const panel = document.getElementById('panel-op-stats');
    if (!panel) return;

    panel.innerHTML = `
        <div class="stat-card" style="max-width:600px; margin:0 auto; border-style:dashed;">
            <h2>DISEÑADOR DE PERSONAJE</h2>
            <div style="display:grid; gap:10px; text-align:left;">
                <label>ID Personaje (Linda, Corvin...):</label>
                <input type="text" id="new-id" style="width:100%; padding:10px; background:#000; color:#fff; border:1px solid #d4af37;">
                <label>Nombre Completo:</label>
                <input type="text" id="new-nom" style="width:100%; padding:10px; background:#000; color:#fff; border:1px solid #d4af37;">
                <label>Biografía:</label>
                <textarea id="new-bio" style="width:100%; height:60px; background:#000; color:#fff; border:1px solid #d4af37; padding:10px;"></textarea>
            </div>
            <button onclick="window.descargarNuevoPersonaje()" style="width:100%; margin-top:20px; background:#006400; color:white;">GENERAR LÍNEA CSV</button>
            <button onclick="window.mostrarPagina('publico')" style="width:100%; margin-top:10px; background:#444;">VOLVER AL CATÁLOGO</button>
        </div>
    `;
}
