import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularValores } from './stats-logic.js';

export function refrescarUI() {
    const container = document.getElementById('contenedor-catalog');
    if(!container) return;

    const ids = Object.keys(statsGlobal).sort((a, b) => {
        const pA = estadoUI.personajesPrincipales.includes(a) ? 0 : 1;
        const pB = estadoUI.personajesPrincipales.includes(b) ? 0 : 1;
        return pA - pB || a.localeCompare(b);
    });

    container.innerHTML = ids.map(id => {
        const d = calcularValores(id);
        const img = `../img/imgpersonajes/${id.toLowerCase()}icon.png`;
        return `
            <div class="personaje-card">
                <div style="margin-bottom:15px;">
                    <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                    <div style="color:#d4af37; font-weight:bold;">${id.toUpperCase()}</div>
                    ${estadoUI.personajesPrincipales.includes(id) ? '<small style="color:#0f0;">PRINCIPAL</small>' : ''}
                </div>
                <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.rActual/d.rMax)*100}%"></div><div class="bar-text">${d.rActual}/${d.rMax} ❤️</div></div>
                <div class="bar-container"><div class="bar-fill bar-blue" style="width:100%"></div><div class="bar-text">${d.azul} 💙</div></div>
                <div class="afin-grid">
                    ${['FIS','ENE','ESP','MAN','PSI','OSC'].map((n, i) => `<div class="afin-box"><label>${n}</label><span>${d.afin[i]}</span></div>`).join('')}
                </div>
            </div>
        `;
    }).join('');
}

export function dibujarMenuOP() {
    document.getElementById('panel-op-central').innerHTML = `
        <div class="op-grid">
            <button onclick="window.mostrarDiseñador()" style="grid-column: span 2; background:#4a004a;">DISEÑADOR DE PERSONAJE</button>
            <button onclick="window.descargarCSV()" style="background:#d4af37; color:#000;">DESCARGAR CSV</button>
            <button onclick="window.mostrarPagina('publico')" style="background:#444;">CERRAR OP</button>
        </div>
    `;
}

export function dibujarDisenador() {
    document.getElementById('panel-op-central').innerHTML = `
        <div class="personaje-card" style="max-width:600px; margin:0 auto;">
            <h2>DISEÑADOR DE PERSONAJE</h2>
            <div style="display:grid; gap:10px; text-align:left;">
                <label>ID (Ej: Linda):</label> <input type="text" id="new-id" style="width:100%; padding:8px;">
                <label>Nombre:</label> <input type="text" id="new-nom" style="width:100%; padding:8px;">
                <label>Bio:</label> <textarea id="new-bio" style="width:100%; height:60px;"></textarea>
            </div>
            <button onclick="window.generarNuevoCSV()" style="width:100%; margin-top:20px; background:#006400;">GENERAR LÍNEA CSV</button>
            <button onclick="window.mostrarPagina('admin')" style="width:100%; margin-top:10px; background:#444;">VOLVER</button>
        </div>
    `;
}
