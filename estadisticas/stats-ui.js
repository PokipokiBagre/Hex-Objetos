import { statsGlobal, estadoUI } from './stats-state.js';
import { calcular } from './stats-logic.js';

/**
 * Genera bloques segmentados para las barras de vida con límite de ancho.
 */
function generarBloques(cur, max, cls) {
    let h = `<div class="block-grid">`;
    for (let i = 0; i < max; i++) {
        const estado = i < cur ? 'on' : '';
        h += `<div class="blk ${cls} ${estado}"></div>`;
    }
    return h + `</div>`;
}

export function refrescarUI() {
    const catalog = document.getElementById('contenedor-catalog');
    const dash = document.getElementById('dashboard-stats');
    if (!catalog || !dash) return;

    if (estadoUI.personajeActivo) {
        catalog.style.display = "none";
        dash.style.display = "block";
        dibujarDetalle(estadoUI.personajeActivo, dash);
    } else {
        catalog.style.display = "grid";
        dash.style.display = "none";
        dibujarCatalogo(catalog);
    }
}

function dibujarCatalogo(container) {
    const ids = Object.keys(statsGlobal).sort((a, b) => {
        const pA = (estadoUI.principales || []).includes(a) ? 0 : 1;
        const pB = (estadoUI.principales || []).includes(b) ? 0 : 1;
        return pA - pB || a.localeCompare(b);
    });

    container.innerHTML = ids.map(id => {
        const d = calcular(id);
        const img = `../img/imgpersonajes/${id.toLowerCase().replace(/\s+/g, '')}icon.png`;
        return `
            <div class="personaje-card" onclick="window.setActivo('${id}')">
                <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                <div class="name-tag">${id.toUpperCase()}</div>
                ${generarBloques(d.r, d.rM, 'b-red')}
                ${(estadoUI.principales || []).includes(id) ? '<small class="owner-tag">PRINCIPAL</small>' : ''}
            </div>`;
    }).join('');
}

function dibujarDetalle(id, container) {
    const d = calcular(id);
    const img = `../img/imgpersonajes/${id.toLowerCase().replace(/\s+/g, '')}icon.png`;
    
    container.innerHTML = `
        <div class="stat-card detail-view">
            <button onclick="window.setActivo(null)" class="btn-close">⬅ VOLVER AL CATÁLOGO</button>
            <img src="${img}" class="img-detail" onerror="this.src='../img/icon.png'">
            <h2 class="gold-t">${id}</h2>
            
            <div class="energy-row">
                <div class="circle c-hex" style="width:${d.sHX}px; height:${d.sHX}px;">
                    <span>${d.hx}<br><small>HEX</small></span>
                </div>
                <div class="circle c-vex" style="width:${d.sVX}px; height:${d.sVX}px;">
                    <span>${d.vxA}<br><small>VEX</small></span>
                </div>
            </div>

            <div class="res-sec">
                <div class="res-group">
                    <label class="red-t">VITALIDAD ROJA (RAD)</label>
                    ${generarBloques(d.r, d.rM, 'b-red')}
                </div>
                <div class="res-group">
                    <label class="blue-t">VITALIDAD AZUL (MAX 30)</label>
                    ${generarBloques(d.a, 30, 'b-blue')}
                </div>
                <div class="res-group">
                    <label class="gold-t">GUARDA DORADA (MAX 15)</label>
                    ${generarBloques(d.g, 15, 'b-gold')}
                </div>
            </div>

            <div class="afin-row">
                ${Object.entries(d.af).map(([k,v]) => `
                    <div class="af-box">
                        <label>${k.toUpperCase()}</label>
                        <span>${v}</span>
                    </div>
                `).join('')}
            </div>
            
            <h3 class="gold-t">HECHIZOS APRENDIDOS (${d.sp.length})</h3>
            <div class="spell-container">
                <table class="spell-table">
                    <tbody>${d.sp.map(s => `<tr><td>${s}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        </div>`;
}

export function dibujarMenuOP() {
    const target = document.getElementById('panel-op-central');
    target.innerHTML = `
        <div class="stat-card op-menu">
            <h2 class="gold-t">ACCESO OP: SISTEMA DE ESTADO</h2>
            <div class="op-grid">
                <button onclick="window.mostrarDiseñador()" style="background:#4a004a;">DISEÑADOR DE PERSONAJE</button>
                <button onclick="window.actualizarTodo()" style="background:#006400;">SINCRONIZAR CSV</button>
                <button onclick="window.mostrarPagina('publico')" style="background:#333;">CERRAR</button>
            </div>
        </div>`;
}

export function dibujarDiseñador() {
    const target = document.getElementById('panel-op-central');
    target.innerHTML = `
        <div class="stat-card designer-form">
            <h2 class="gold-t">NUEVO PERSONAJE (A-S)</h2>
            <div class="form-grid">
                <div class="input-group"><label>ID (Ej: Linda)</label><input id="n-id"></div>
                <div class="input-group"><label>Hex</label><input id="n-hx" type="number" value="0"></div>
                <div class="input-group"><label>Vex</label><input id="n-vx" type="number" value="0"></div>
                <div class="input-group"><label>Fis</label><input id="n-fi" type="number" value="0"></div>
                <div class="input-group"><label>Ene</label><input id="n-en" type="number" value="0"></div>
                <div class="input-group"><label>Esp</label><input id="n-es" type="number" value="0"></div>
                <div class="input-group"><label>Man</label><input id="n-ma" type="number" value="0"></div>
                <div class="input-group"><label>Psi</label><input id="n-ps" type="number" value="0"></div>
                <div class="input-group"><label>Osc</label><input id="n-os" type="number" value="0"></div>
                <div class="input-group"><label>Rojo Act</label><input id="n-ra" type="number" value="0"></div>
                <div class="input-group"><label>Rojo Max Base</label><input id="n-rm" type="number" placeholder="Ej: 11"></div>
                <div class="input-group"><label>Azul Act</label><input id="n-aa" type="number" value="0"></div>
            </div>
            <div class="input-group full-width" style="margin-top:10px;">
                <label>Lista Hechizos (Separados por comas)</label>
                <textarea id="n-sp" placeholder="MENTALISMO, PSIONICA..."></textarea>
            </div>
            <button onclick="window.agregarYRefrescar()" class="btn-save" style="background:green; margin-top:15px; width:100%; padding:10px; color:white; font-weight:bold;">CREAR PERSONAJE</button>
            <button onclick="window.mostrarPagina('admin')" style="width:100%; margin-top:10px; background:#444; color:white;">VOLVER</button>
        </div>`;
}
