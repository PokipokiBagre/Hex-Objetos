import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularFicha } from './stats-logic.js';

export function refrescarUI() {
    dibujarCatalogo();
    dibujarTablaRaw();
}

function dibujarCatalogo() {
    const catalog = document.getElementById('contenedor-catalog');
    if(!catalog) return;
    
    catalog.innerHTML = Object.keys(statsGlobal).sort().map(id => {
        const d = calcularFicha(id);
        const img = `../img/imgpersonajes/${id.toLowerCase()}icon.png`;
        return `
            <div class="personaje-card" onclick="window.verDetalle('${id}')">
                <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                <div style="color:#d4af37; font-weight:bold; margin-top:5px;">${id.toUpperCase()}</div>
                <div class="bar-container"><div class="bar-fill bar-purple" style="width:100%"></div><div class="bar-text">${d.hx} HEX</div></div>
                <div class="bar-container"><div class="bar-fill bar-red" style="width:${(d.r/d.rm)*100}%"></div><div class="bar-text">${d.r}/${d.rm} ❤️</div></div>
            </div>`;
    }).join('');
}

function dibujarTablaRaw() {
    const container = document.getElementById('contenedor-tabla');
    if(!container) return;
    let html = `<table><tr><th>ID</th><th>HEX</th><th>VEX</th><th>FIS</th><th>ENE</th><th>ESP</th><th>MAN</th><th>PSI</th><th>OSC</th><th>R</th><th>RM</th><th>A</th><th>G</th></tr>`;
    Object.keys(statsGlobal).sort().forEach(id => {
        const s = statsGlobal[id];
        html += `<tr><td>${id}</td><td>${s.hx}</td><td>${s.vx}</td><td>${s.fi}</td><td>${s.en}</td><td>${s.es}</td><td>${s.ma}</td><td>${s.ps}</td><td>${s.os}</td><td>${s.r}</td><td>${s.rm}</td><td>${s.az}</td><td>${s.gd}</td></tr>`;
    });
    container.innerHTML = html + "</table>";
}

export function dibujarMenuOP() {
    document.getElementById('panel-op-central').innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:20px;">
            <button onclick="window.mostrarDiseñador()" style="grid-column: span 2; background:#4a004a;">NUEVO PERSONAJE (A-S)</button>
            <button onclick="window.mostrarPagina('publico')" style="background:#444;">CERRAR OP</button>
        </div>`;
}

export function dibujarDiseñador() {
    document.getElementById('panel-op-central').innerHTML = `
        <div class="personaje-card" style="max-width:800px; margin:auto; text-align:left;">
            <h2 style="text-align:center;">DISEÑADOR DE PERSONAJE</h2>
            <div class="designer-grid">
                <input id="n-id" placeholder="ID (Linda)"> <input id="n-hx" type="number" placeholder="Hex"> <input id="n-vx" type="number" placeholder="Vex">
                <input id="n-fi" type="number" placeholder="Física"> <input id="n-en" type="number" placeholder="Energía"> <input id="n-es" type="number" placeholder="Espiritual">
                <input id="n-ma" type="number" placeholder="Mando"> <input id="n-ps" type="number" placeholder="Psique"> <input id="n-os" type="number" placeholder="Oscura">
                <input id="n-ra" type="number" placeholder="Rojo Actual"> <input id="n-rm" type="number" placeholder="Rojo MaxBase" value="10"> <input id="n-aa" type="number" placeholder="Azul">
            </div>
            <button onclick="window.agregarLocal()" style="width:100%; background:#006400;">AGREGAR PERSONAJE</button>
            <button onclick="window.mostrarPagina('admin')" style="width:100%; background:#444; margin-top:10px;">VOLVER</button>
        </div>`;
}
