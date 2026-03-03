import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularVidaRojaMax, calcularVexMax } from './stats-logic.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');

export function dibujarCatalogo() {
    const contenedor = document.getElementById('vista-catalogo');
    let html = '';
    
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        const iconPath = `../img/imgpersonajes/${normalizar(nombre)}icon.png`;
        
        html += `
        <div class="char-card" onclick="window.abrirDetalle('${nombre}')">
            <img src="${iconPath}" onerror="this.src='../img/imgpersonajes/defaulticon.png'">
            <h3>${nombre}</h3>
            <p>HEX: <strong>${p.hex}</strong> | VEX: <strong>${p.vex}</strong></p>
        </div>`;
    });
    
    contenedor.innerHTML = html;
}

export function dibujarDetalle() {
    const nombre = estadoUI.personajeSeleccionado;
    const p = statsGlobal[nombre];
    if(!p) return;

    const contenedor = document.getElementById('vista-detalle');
    
    // Cálculos visuales para los círculos (Promedio 2000 => 100%)
    let hexPercent = Math.min((p.hex / 2000) * 100, 100);
    let vexPercent = Math.min((p.vex / 2000) * 100, 100);
    
    // Corazones Rojos
    let vidaRojaVisual = p.vidaRojaMax > 0 ? p.vidaRojaMax : calcularVidaRojaMax(p);
    let corazonesRojosHTML = '';
    for(let i=0; i < vidaRojaVisual; i++) {
        corazonesRojosHTML += `<div class="heart-red ${i >= p.vidaRojaActual ? 'empty' : ''}"></div>`;
    }

    // Corazones Azules y Guardas (1 por cada punto)
    let corazonesAzulesHTML = '';
    for(let i=0; i < p.vidaAzul; i++) corazonesAzulesHTML += `<div class="heart-blue"></div>`;
    
    let guardasHTML = '';
    for(let i=0; i < p.guardaDorada; i++) guardasHTML += `<div class="guard-gold"></div>`;

    let html = `
    <div style="display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #d4af37; padding-bottom: 20px;">
        <img src="../img/imgpersonajes/${normalizar(nombre)}icon.png" style="width: 120px; border-radius: 50%; border: 3px solid #d4af37;" onerror="this.src='../img/imgpersonajes/defaulticon.png'">
        <div>
            <h1 style="margin: 0;">${nombre.toUpperCase()}</h1>
            <p style="color:#aaa; margin-top:5px;">Estadísticas Base y Capacidades</p>
        </div>
    </div>

    <div class="circle-wrap">
        <div class="stat-circle" style="background: conic-gradient(var(--gold) ${hexPercent}%, #222 0);">
            <div class="inner"><strong>${p.hex}</strong><span>HEX</span></div>
        </div>
        <div class="stat-circle" style="background: conic-gradient(var(--blue-life) ${vexPercent}%, #222 0);">
            <div class="inner"><strong>${p.vex}</strong><span>VEX</span></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div>
            <h3 style="margin-top:0;">Vitalidad</h3>
            <div class="health-box">
                <label style="color:var(--red-life);">VIDA ROJA (${p.vidaRojaActual}/${vidaRojaVisual})</label>
                <div class="health-grid">${corazonesRojosHTML || '<span style="color:#555">Sin vida roja</span>'}</div>
            </div>
            <div class="health-box">
                <label style="color:var(--blue-life);">VIDA AZUL (${p.vidaAzul})</label>
                <div class="health-grid">${corazonesAzulesHTML || '<span style="color:#555">Sin vida azul</span>'}</div>
            </div>
            <div class="health-box">
                <label style="color:var(--gold);">GUARDA DORADA (${p.guardaDorada})</label>
                <div class="health-grid">${guardasHTML || '<span style="color:#555">Sin guarda</span>'}</div>
            </div>
        </div>

        <div>
            <h3 style="margin-top:0;">Afinidades</h3>
            <div class="affinities-grid">
                <div class="affinity-box"><label>Física</label><span>${p.afinidades.fisica}</span></div>
                <div class="affinity-box"><label>Energética</label><span>${p.afinidades.energetica}</span></div>
                <div class="affinity-box"><label>Espiritual</label><span>${p.afinidades.espiritual}</span></div>
                <div class="affinity-box"><label>Mando</label><span>${p.afinidades.mando}</span></div>
                <div class="affinity-box"><label>Psíquica</label><span>${p.afinidades.psiquica}</span></div>
                <div class="affinity-box"><label>Oscura</label><span>${p.afinidades.oscura}</span></div>
            </div>
        </div>
    </div>`;

    contenedor.innerHTML = html;
}
