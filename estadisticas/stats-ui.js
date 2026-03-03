import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularVidaRojaMax, calcularVexMax } from './stats-logic.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');

const calcTotal = (base, buff) => (base || 0) + (buff || 0);
const bText = (val) => val > 0 ? `<span style="color:#00ff00; font-size:0.6em; vertical-align:middle;"> (+${val})</span>` : (val < 0 ? `<span style="color:red; font-size:0.6em; vertical-align:middle;"> (${val})</span>` : '');

const imgError = "this.onerror=null; this.src='../img/imgobjetos/no_encontrado.png'";

export function dibujarCatalogo() {
    const contenedor = document.getElementById('vista-catalogo');
    let html = '';
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        html += `
        <div class="char-card" onclick="window.abrirDetalle('${nombre}')">
            <img src="../img/imgpersonajes/${normalizar(nombre)}icon.png" onerror="${imgError}">
            <h3>${nombre}</h3>
            <p>HEX: <strong>${p.hex}</strong> | VEX: <strong>${calcularVexMax(p)}</strong></p>
        </div>`;
    });
    contenedor.innerHTML = html;
}

export function dibujarDetalle() {
    const nombre = estadoUI.personajeSeleccionado;
    const p = statsGlobal[nombre];
    if(!p) return;
    if(!p.buffs) p.buffs = { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0 };

    const contenedor = document.getElementById('vista-detalle');
    let vidaRojaVisual = calcularVidaRojaMax(p);
    let vexVisual = calcularVexMax(p);
    let hexPercent = Math.min((p.hex / 2000) * 100, 100);
    let vexPercent = Math.min((vexVisual / 2000) * 100, 100);
    
    let corazonesRojosHTML = ''; for(let i=0; i < vidaRojaVisual; i++) corazonesRojosHTML += `<div class="heart-red ${i >= p.vidaRojaActual ? 'empty' : ''}"></div>`;
    let corazonesAzulesHTML = ''; for(let i=0; i < p.vidaAzul; i++) corazonesAzulesHTML += `<div class="heart-blue"></div>`;
    let guardasHTML = ''; for(let i=0; i < p.guardaDorada; i++) guardasHTML += `<div class="guard-gold"></div>`;

    let html = `
    <div style="display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #d4af37; padding-bottom: 20px;">
        <img src="../img/imgpersonajes/${normalizar(nombre)}icon.png" style="width: 120px; border-radius: 50%; border: 3px solid #d4af37;" onerror="${imgError}">
        <div>
            <h1 style="margin: 0;">${nombre.toUpperCase()} ${p.isNPC ? '<span style="font-size:0.4em; color:#aaa">[NPC]</span>' : ''}</h1>
        </div>
        ${estadoUI.esAdmin ? `<button onclick="window.mostrarPaginaOP('editar')" style="margin-left:auto; background:#4a004a; border-color:#d4af37;">Editar / Buffs</button>` : ''}
    </div>

    <div class="circle-wrap">
        <div class="stat-circle" style="background: conic-gradient(var(--gold) ${hexPercent}%, #222 0);"><div class="inner"><strong>${p.hex}</strong><span>HEX</span></div></div>
        <div class="stat-circle" style="background: conic-gradient(var(--blue-life) ${vexPercent}%, #222 0);"><div class="inner"><strong>${vexVisual}</strong><span>VEX</span></div></div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div>
            <h3 style="margin-top:0;">Vitalidad</h3>
            <div class="health-box"><label style="color:var(--red-life);">VIDA ROJA (${p.vidaRojaActual}/${vidaRojaVisual})</label><div class="health-grid">${corazonesRojosHTML}</div></div>
            <div class="health-box"><label style="color:var(--blue-life);">VIDA AZUL (${p.vidaAzul})</label><div class="health-grid">${corazonesAzulesHTML}</div></div>
            <div class="health-box"><label style="color:var(--gold);">GUARDA DORADA (${p.guardaDorada})</label><div class="health-grid">${guardasHTML}</div></div>
            
            <h3 style="margin-top:20px;">Ofensiva</h3>
            <div class="affinities-grid">
                <div class="affinity-box"><label style="color:var(--red-life)">Daño Rojo</label><span>${calcTotal(p.danoRojo, p.buffs.danoRojo)}${bText(p.buffs.danoRojo)}</span></div>
                <div class="affinity-box"><label style="color:var(--blue-life)">Daño Azul</label><span>${calcTotal(p.danoAzul, p.buffs.danoAzul)}${bText(p.buffs.danoAzul)}</span></div>
                <div class="affinity-box"><label style="color:var(--gold)">Elim. Dorada</label><span>${calcTotal(p.elimDorada, p.buffs.elimDorada)}${bText(p.buffs.elimDorada)}</span></div>
            </div>
        </div>
        <div>
            <h3 style="margin-top:0;">Afinidades</h3>
            <div class="affinities-grid">
                <div class="affinity-box"><label>Física</label><span>${calcTotal(p.afinidades.fisica, p.buffs.fisica)}${bText(p.buffs.fisica)}</span></div>
                <div class="affinity-box"><label>Energética</label><span>${calcTotal(p.afinidades.energetica, p.buffs.energetica)}${bText(p.buffs.energetica)}</span></div>
                <div class="affinity-box"><label>Espiritual</label><span>${calcTotal(p.afinidades.espiritual, p.buffs.espiritual)}${bText(p.buffs.espiritual)}</span></div>
                <div class="affinity-box"><label>Mando</label><span>${calcTotal(p.afinidades.mando, p.buffs.mando)}${bText(p.buffs.mando)}</span></div>
                <div class="affinity-box"><label>Psíquica</label><span>${calcTotal(p.afinidades.psiquica, p.buffs.psiquica)}${bText(p.buffs.psiquica)}</span></div>
                <div class="affinity-box"><label>Oscura</label><span>${calcTotal(p.afinidades.oscura, p.buffs.oscura)}${bText(p.buffs.oscura)}</span></div>
            </div>
        </div>
    </div>
    
    <div style="margin-top:30px; background:#0a0014; border:1px solid var(--gold); padding:20px; border-radius:8px;">
        <h3 style="margin-top:0; color:var(--gold); text-align:center;">Acciones Rápidas (Públicas)</h3>
        <p style="text-align:center; color:#aaa; font-size:0.8em;">Alteraciones directas sin validación OP.</p>
        <div class="edit-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));">
            <div class="edit-card">
                <h4>Ganancia HEX</h4>
                <div class="btn-row">
                    <button class="btn-plus" style="background:#004a4a; border-color:#00ffff;" onclick="window.modLibre('hex', 300)">+300 Inicial</button>
                    <button class="btn-minus" onclick="window.modLibre('hex', -50)">-50</button>
                </div>
            </div>
            <div class="edit-card">
                <h4>Vida Roja (Actual)</h4>
                <div class="btn-row">
                    <button class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 1)">+1 (Curar)</button>
                    <button class="btn-minus" onclick="window.modLibre('vidaRojaActual', -1)">-1 (Daño)</button>
                </div>
            </div>
            <div class="edit-card">
                <h4>Corazones Azules</h4>
                <div class="btn-row">
                    <button class="btn-plus" onclick="window.modLibre('vidaAzul', 1)">+1</button>
                    <button class="btn-minus" onclick="window.modLibre('vidaAzul', -1)">-1</button>
                </div>
            </div>
            <div class="edit-card">
                <h4>Guarda Dorada</h4>
                <div class="btn-row">
                    <button class="btn-plus" onclick="window.modLibre('guardaDorada', 1)">+1</button>
                    <button class="btn-minus" onclick="window.modLibre('guardaDorada', -1)">-1</button>
                </div>
            </div>
        </div>
    </div>`;

    contenedor.innerHTML = html;
}

export function dibujarMenuOP() {
    return `
        <h3>PANEL DE OPERADOR</h3>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;">
            <button onclick="window.mostrarPaginaOP('crear')" style="background:#004a4a">Crear NPC (Manual)</button>
            <button onclick="window.forzarSincronizacion()" class="btn-green">Sincronizar Sheet</button>
            <button onclick="window.descargarAumentada()">Descargar CSV</button>
            <button onclick="document.getElementById('subir-csv').click()" class="btn-red">Subir CSV</button>
        </div>
        <div id="sub-vista-op"></div>
    `;
}

export function dibujarFormularioCrear() {
    // Array exhaustivo de campos para Crear NPC
    const fields = [
        { id: 'npc-hex', label: 'HEX Inicial', val: 0 }, { id: 'npc-vex', label: 'VEX Inicial', val: 0 },
        { id: 'npc-vra', label: 'Corazones Rojos (Actual)', val: 10 }, { id: 'npc-vrm', label: 'Corazones Rojos (Límite Máx)', val: 10 },
        { id: 'npc-va', label: 'Corazones Azules', val: 0 }, { id: 'npc-gd', label: 'Guarda Dorada', val: 0 },
        { id: 'npc-dr', label: 'Daño Rojo', val: 0 }, { id: 'npc-da', label: 'Daño Azul', val: 0 }, { id: 'npc-ed', label: 'Elim. Dorada', val: 0 },
        { id: 'npc-fis', label: 'Afin. Física', val: 0 }, { id: 'npc-ene', label: 'Afin. Energética', val: 0 }, { id: 'npc-esp', label: 'Afin. Espiritual', val: 0 },
        { id: 'npc-man', label: 'Afin. Mando', val: 0 }, { id: 'npc-psi', label: 'Afin. Psíquica', val: 0 }, { id: 'npc-osc', label: 'Afin. Oscura', val: 0 }
    ];
    
    let html = `
    <div style="text-align:center; max-width:1000px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Forja de Personaje / NPC</h3>
        <input type="text" id="npc-nombre" placeholder="Nombre del NPC..." style="width:100%; max-width:400px; margin-bottom:20px; padding:10px; background:#000; color:var(--gold); border:1px solid var(--gold); font-size:1.2em; text-align:center; font-family:'Cinzel', serif;">
        <div class="edit-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));">`;

    fields.forEach(f => {
        html += `
        <div class="edit-card">
            <h4>${f.label}</h4>
            <input type="number" id="${f.id}" value="${f.val}" style="width:80%; text-align:center; background:#000; color:white; border:1px dashed var(--gold); margin-bottom:10px; font-size:1.5em; padding:5px;" readonly>
            <div class="btn-row"><button class="btn-plus" onclick="window.modForm('${f.id}', 1)">+1</button><button class="btn-minus" onclick="window.modForm('${f.id}', -1)">-1</button></div>
            <div class="btn-row"><button class="btn-plus5" onclick="window.modForm('${f.id}', 5)">+5</button><button class="btn-minus5" onclick="window.modForm('${f.id}', -5)">-5</button></div>
        </div>`;
    });

    html += `</div>
        <button onclick="window.ejecutarCreacionNPC()" style="width:100%; max-width:400px; margin-top:30px; background:var(--gold); color:black; font-weight:bold; font-size:1.2em; padding:15px;">GUARDAR PERSONAJE</button>
    </div>`;
    return html;
}

export function dibujarFormularioEditar() {
    const p = statsGlobal[estadoUI.personajeSeleccionado];
    if(!p) return `<p>Selecciona un personaje en el catálogo primero.</p>`;

    const statsAEditar = [
        { id: 'danoRojo', label: 'Daño Rojo Extra' }, { id: 'danoAzul', label: 'Daño Azul Extra' }, { id: 'elimDorada', label: 'Elim. Dorada Extra' },
        { id: 'fisica', label: 'Afin. Física Extra' }, { id: 'energetica', label: 'Afin. Energética Extra' }, { id: 'espiritual', label: 'Afin. Espiritual Extra' },
        { id: 'mando', label: 'Afin. Mando Extra' }, { id: 'psiquica', label: 'Afin. Psíquica Extra' }, { id: 'oscura', label: 'Afin. Oscura Extra' },
        { id: 'vidaRojaMaxExtra', label: 'Corazones Límite Extra' }
    ];

    let html = `
    <div style="text-align:center; max-width:900px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Alteración Temporal: ${estadoUI.personajeSeleccionado}</h3>
        <button onclick="window.abrirDetalle('${estadoUI.personajeSeleccionado}')" style="background:#444; margin-bottom: 15px;">⬅ Volver al Perfil</button>
        
        <div style="background:#111; border:1px dashed #d4af37; padding:15px; margin-bottom:20px; border-radius:8px; display:flex; justify-content:space-around;">
            <span style="font-size:1.2em;">❤️ Vida Límite Actual: <strong style="color:var(--red-life); font-size:1.5em;">${calcularVidaRojaMax(p)}</strong></span>
            <span style="font-size:1.2em;">🌀 VEX Máx Actual: <strong style="color:var(--blue-life); font-size:1.5em;">${calcularVexMax(p)}</strong></span>
        </div>

        <div class="edit-grid">`;

    statsAEditar.forEach(s => {
        const val = p.buffs[s.id] || 0;
        const colorVal = val > 0 ? '#00ff00' : (val < 0 ? 'red' : 'var(--gold)');
        const displayVal = val > 0 ? `+${val}` : val;

        html += `
        <div class="edit-card">
            <h4>${s.label}</h4>
            <span style="color: ${colorVal}">${displayVal}</span>
            <div class="btn-row"><button class="btn-plus" onclick="window.modificarBuff('${s.id}', 1)">+1</button><button class="btn-minus" onclick="window.modificarBuff('${s.id}', -1)">-1</button></div>
            <div class="btn-row"><button class="btn-plus5" onclick="window.modificarBuff('${s.id}', 5)">+5</button><button class="btn-minus5" onclick="window.modificarBuff('${s.id}', -5)">-5</button></div>
        </div>`;
    });

    html += `</div></div>`;
    return html;
}
