import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularFicha } from './stats-logic.js';

function renderBlocks(curr, max, cls) {
    let h = `<div class="segmented-bar">`;
    for(let i=0; i<max; i++) h += `<div class="block ${cls} ${i < curr ? 'filled' : ''}"></div>`;
    return h + `</div>`;
}

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
        const img = `../img/imgpersonajes/${id.toLowerCase()}icon.png`;
        return `
            <div class="personaje-card" onclick="window.setActivo('${id}')">
                <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                <div style="color:#d4af37; font-weight:bold; font-size:1em; margin-bottom:10px;">${id.toUpperCase()}</div>
                ${renderBlocks(d.r, d.rM, 'red-block')}
                ${estadoUI.principales.includes(id) ? '<small style="color:#0f0; display:block; margin-top:5px;">PRINCIPAL</small>' : ''}
            </div>`;
    }).join('');
}

function dibujarDetalle(id, container) {
    const d = calcularFicha(id);
    container.innerHTML = `
        <div class="personaje-card" style="max-width:850px; margin:auto; cursor:default;">
            <button onclick="window.setActivo(null)" style="float:right;">CERRAR</button>
            <h2 style="color:#d4af37; margin:0 0 20px 0; text-align:left;">${id}</h2>
            
            <div class="energy-container">
                <div class="energy-circle circle-hex" style="width:${d.sHX}px; height:${d.sHX}px;"><span>${d.hx}<br><small>HEX</small></span></div>
                <div class="energy-circle circle-vex" style="width:${d.sVX}px; height:${d.sVX}px;"><span>${d.vxA}<br><small>VEX</small></span></div>
            </div>

            <div style="text-align:left; margin-bottom:20px;">
                <label style="font-size:0.7em; color:#ff4d4d;">VITALIDAD RAD (ROJA)</label>
                ${renderBlocks(d.r, d.rM, 'red-block')}
                <label style="font-size:0.7em; color:#00bfff;">VITALIDAD RAD (AZUL)</label>
                ${renderBlocks(d.a, 30, 'blue-block')}
                <label style="font-size:0.7em; color:#ffd700;">GUARDA DORADA</label>
                ${renderBlocks(d.o, 15, 'gold-block')}
            </div>

            <div class="afin-grid">${Object.entries(d.afin).map(([k,v])=>`<div class="afin-box"><label>${k.toUpperCase()}</label><span>${v}</span></div>`).join('')}</div>
            
            <h3 style="margin-top:20px;">HECHIZOS (${d.spells.length})</h3>
            <table class="spell-table" style="width:100%; font-size:0.8em;">
                ${d.spells.map(s => `<tr><td>${s.afin}</td><td>${s.nom}</td><td style="color:#d4af37;">${s.hex}</td></tr>`).join('')}
            </table>
        </div>`;
}

export function dibujarDiseñador() {
    document.getElementById('panel-op-central').innerHTML = `
        <div class="personaje-card" style="max-width:700px; margin:auto; text-align:left;">
            <h2>NUEVO PERSONAJE</h2>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
                <input id="n-id" placeholder="ID (Linda)"> <input id="n-hx" type="number" placeholder="Hex"> <input id="n-vx" type="number" placeholder="Vex">
                <input id="n-fi" type="number" placeholder="Fis"> <input id="n-en" type="number" placeholder="Ene"> <input id="n-es" type="number" placeholder="Esp">
                <input id="n-ma" type="number" placeholder="Man"> <input id="n-ps" type="number" placeholder="Psi"> <input id="n-os" type="number" placeholder="Osc">
                <input id="n-ra" type="number" placeholder="RojoAct"> <input id="n-rm" type="number" placeholder="RojoMaxBase"> <input id="n-aa" type="number" placeholder="AzulAct">
            </div>
            <button onclick="window.agregarYRefrescar()" style="width:100%; background:#006400; margin-top:20px;">AGREGAR PERSONAJE A LA LISTA</button>
            <button onclick="window.mostrarPagina('publico')" style="width:100%; background:#444; margin-top:10px;">CANCELAR</button>
        </div>`;
}
