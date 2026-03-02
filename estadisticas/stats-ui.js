import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularValores, exportarCSVCompleto } from './stats-logic.js';

export function refrescarUI() {
    const catalog = document.getElementById('contenedor-catalog');
    const dash = document.getElementById('dashboard-stats');
    if(!catalog) return;

    if(estadoUI.personajeActivo) {
        catalog.style.display = "none";
        dibujarFicha(estadoUI.personajeActivo, dash);
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
        const d = calcularValores(id);
        const img = `../img/imgpersonajes/${id.toLowerCase()}icon.png`;
        return `
            <div class="personaje-card" onclick="window.setActivo('${id}')">
                <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                <div style="color:#d4af37; font-weight:bold;">${id.toUpperCase()}</div>
                <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.r/d.rM)*100}%"></div><div class="bar-text">${d.r}/${d.rM} ❤️</div></div>
                ${estadoUI.principales.includes(id) ? '<small style="color:#0f0;">PROPIETARIO</small>' : ''}
            </div>`;
    }).join('');
}

function dibujarFicha(id, container) {
    const d = calcularValores(id);
    container.innerHTML = `
        <div class="stat-card" style="text-align:left;">
            <button onclick="window.setActivo(null)" style="float:right;">CERRAR</button>
            <h2 style="color:#d4af37; border-bottom:1px solid #d4af3744;">${id}</h2>
            <div class="resource-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div>
                    <label>VIDA RAD</label>
                    <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.r/d.rM)*100}%"></div><div class="bar-text">${d.r}/${d.rM} ❤️</div></div>
                    <div class="bar-container"><div class="bar-fill bar-blue" style="width:100%"></div><div class="bar-text">${d.a} Azules</div></div>
                </div>
                <div>
                    <label>MÁGICA</label>
                    <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${d.hx} HEX</div></div>
                    <div class="bar-container"><div class="bar-fill bar-green" style="width:${(d.vxA/d.vxM)*100}%"></div><div class="bar-text">${d.vxA}/${d.vxM} VEX</div></div>
                </div>
            </div>
            <div class="afin-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:15px;">
                ${Object.entries(d.afin).map(([k,v])=>`<div class="afin-box" style="background:rgba(0,0,0,0.4); text-align:center;"><label style="font-size:0.6em; color:#aaa;">${k.toUpperCase()}</label><span style="color:#d4af37;">${v}</span></div>`).join('')}
            </div>
            <h3>HECHIZOS APRENDIDOS</h3>
            <table class="spell-table" style="width:100%;">
                ${d.spells.map(s => `<tr><td>${s.afin}</td><td>${s.nom}</td><td style="color:#d4af37;">${s.hex}</td></tr>`).join('')}
            </table>
        </div>`;
}

export function dibujarMenuOP() {
    document.getElementById('panel-op-central').innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:20px;">
            <button onclick="window.dibujarDiseñador()" style="grid-column: span 2; background:#4a004a;">CREAR PERSONAJE</button>
            <button onclick="window.descargarEstadoCSV()" style="background:#d4af37; color:#000;">DESCARGAR TODO (CSV)</button>
            <button onclick="window.mostrarPagina('publico')" style="background:#444;">CERRAR</button>
        </div>`;
}

export function dibujarDiseñador() {
    document.getElementById('panel-op-central').innerHTML = `
        <div class="stat-card" style="max-width:800px; margin:auto; text-align:left;">
            <h2>DISEÑADOR A-S</h2>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px;">
                <input id="n-id" placeholder="ID (Linda)"> <input id="n-hx" type="number" placeholder="Hex"> <input id="n-vx" type="number" placeholder="Vex">
                <input id="n-fi" type="number" placeholder="Fis"> <input id="n-en" type="number" placeholder="Ene"> <input id="n-es" type="number" placeholder="Esp">
                <input id="n-ma" type="number" placeholder="Man"> <input id="n-ps" type="number" placeholder="Psi"> <input id="n-os" type="number" placeholder="Osc">
                <input id="n-ra" type="number" placeholder="RojoAct"> <input id="n-rm" type="number" placeholder="RojoMax" value="10"> <input id="n-aa" type="number" placeholder="Azul">
            </div>
            <textarea id="n-sp" placeholder="Hechizos (Q, R, S...)" style="width:98%; height:50px; margin-top:10px;"></textarea>
            <button onclick="window.agregarManual()" style="width:100%; background:#006400; margin-top:15px;">AGREGAR A PERSONAJES</button>
            <button onclick="window.mostrarPagina('admin')" style="width:100%; background:#444; margin-top:10px;">VOLVER</button>
        </div>`;
}
