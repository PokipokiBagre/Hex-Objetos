import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularTodo, exportarCSV } from './stats-logic.js';

export function refrescarUI() {
    dibujarCatalogo();
    dibujarFicha();
}

function dibujarCatalogo() {
    const container = document.getElementById('catalogo-personajes');
    if(!container || estadoUI.personajeActivo) { container.innerHTML = ""; return; }

    const ids = Object.keys(statsGlobal).sort((a, b) => {
        const prioA = estadoUI.principales.includes(a) ? 0 : 1;
        const prioB = estadoUI.principales.includes(b) ? 0 : 1;
        return prioA - prioB || a.localeCompare(b);
    });

    container.innerHTML = ids.map(id => `
        <div class="personaje-card" onclick="window.setPersonaje('${id}')">
            <img src="../img/imgpersonajes/${id.toLowerCase()}icon.png" onerror="this.src='../img/icon.png'">
            <span>${id.toUpperCase()}</span>
            ${estadoUI.principales.includes(id) ? '<span class="priority-tag">PRINCIPAL</span>' : ''}
        </div>
    `).join('');
}

function dibujarFicha() {
    const dash = document.getElementById('dashboard-stats');
    const data = calcularTodo(estadoUI.personajeActivo);
    if(!data) { dash.innerHTML = ""; return; }

    dash.innerHTML = `
        <div class="stat-card">
            <button onclick="window.setPersonaje(null)" style="float:right;">VOLVER AL CATÁLOGO</button>
            <div class="player-header">
                <img src="../img/imgpersonajes/${estadoUI.personajeActivo.toLowerCase()}icon.png" class="player-icon" onerror="this.src='../img/icon.png'">
                <div style="text-align:left;"><h2>${data.nombre}</h2><p>${data.bio}</p></div>
            </div>
            <div class="resource-grid">
                <div>
                    <label>VITALIDAD ROJA (RAD)</label>
                    <div class="bar-container"><div class="bar-fill bar-red" style="width:${(data.roja/data.rojaMax)*100}%"></div><div class="bar-text">${data.roja} / ${data.rojaMax}</div></div>
                </div>
                <div>
                    <label>HEX / VEX</label>
                    <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${data.hex} HEX</div></div>
                </div>
            </div>
            <div class="afin-grid">
                ${['Fís','Ene','Esp','Man','Psi','Osc'].map((n, i) => `<div class="afin-box"><label>${n}</label><span>${data.afin[i]}</span></div>`).join('')}
            </div>
        </div>`;
}

export function dibujarDisenador() {
    document.getElementById('panel-op-stats').innerHTML = `
        <h2>DISEÑADOR DE PERSONAJE</h2>
        <div class="stat-card" style="max-width:500px; margin: auto;">
            <input type="text" id="new-p-id" placeholder="ID (Ej: Corvin)" style="width:100%; margin-bottom:10px; padding:10px;">
            <input type="text" id="new-p-nom" placeholder="Nombre Completo" style="width:100%; margin-bottom:10px; padding:10px;">
            <textarea id="new-p-bio" placeholder="Biografía..." style="width:100%; height:60px; padding:10px;"></textarea>
            <button onclick="window.crearPersonaje()" style="width:100%; background:#006400; margin-top:20px;">GUARDAR Y DESCARGAR CSV</button>
            <button onclick="window.mostrarPagina('publico')" style="width:100%; background:#444; margin-top:10px;">CANCELAR</button>
        </div>
    `;
}
