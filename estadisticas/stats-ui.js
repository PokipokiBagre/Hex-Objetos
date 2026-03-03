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
    let hexPercent = Math.min((p.hex / 4000) * 100, 100);
    let vexPercent = Math.min((vexVisual / 4000) * 100, 100);
    
    // CORAZONES ROJOS (Desborde)
    let extraRojo = Math.max(0, p.vidaRojaActual - vidaRojaVisual);
    let normalRojo = Math.min(p.vidaRojaActual, vidaRojaVisual);
    let vaciosRojo = Math.max(0, vidaRojaVisual - normalRojo);
    let corazonesRojosHTML = ''; 
    for(let i=0; i<normalRojo; i++) corazonesRojosHTML += `<div class="heart-red"></div>`;
    for(let i=0; i<vaciosRojo; i++) corazonesRojosHTML += `<div class="heart-red empty"></div>`;
    for(let i=0; i<extraRojo; i++) corazonesRojosHTML += `<div class="heart-red" style="background:#800000; border:1px solid #ff0000; transform:scale(0.9);"></div>`;
    if (extraRojo > 0) corazonesRojosHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraRojo}</div>`;

    // CORAZONES AZULES (Desborde)
    let baseAzul = p.baseVidaAzul !== undefined ? p.baseVidaAzul : p.vidaAzul;
    let extraAzul = Math.max(0, p.vidaAzul - baseAzul);
    let normalAzul = Math.min(p.vidaAzul, baseAzul);
    let corazonesAzulesHTML = ''; 
    for(let i=0; i<normalAzul; i++) corazonesAzulesHTML += `<div class="heart-blue"></div>`;
    for(let i=0; i<extraAzul; i++) corazonesAzulesHTML += `<div class="heart-blue" style="background:#1a4b8c; border:1px solid #4a90e2; transform:scale(0.9);"></div>`;
    if (extraAzul > 0) corazonesAzulesHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraAzul}</div>`;

    // GUARDA DORADA (Desborde)
    let baseGuarda = p.baseGuardaDorada !== undefined ? p.baseGuardaDorada : p.guardaDorada;
    let extraGuarda = Math.max(0, p.guardaDorada - baseGuarda);
    let normalGuarda = Math.min(p.guardaDorada, baseGuarda);
    let guardasHTML = ''; 
    for(let i=0; i<normalGuarda; i++) guardasHTML += `<div class="guard-gold"></div>`;
    for(let i=0; i<extraGuarda; i++) guardasHTML += `<div class="guard-gold" style="background:#8b6508; border:1px solid #d4af37; transform: rotate(45deg) scale(0.8);"></div>`;
    if (extraGuarda > 0) guardasHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraGuarda}</div>`;

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
        <h3 style="margin-top:0; color:var(--gold); text-align:center;">Acciones Rápidas</h3>
        <div class="edit-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
            <div class="edit-card">
                <h4>Ganancia HEX</h4>
                <div class="btn-row"><button class="btn-plus" style="background:#004a4a; border-color:#00ffff;" onclick="window.modLibre('hex', 300)">+300</button><button class="btn-plus" style="background:#004a4a; border-color:#00ffff;" onclick="window.modLibre('hex', 1000)">+1000</button></div>
                <div class="btn-row"><button class="btn-minus" style="background:#4a0000;" onclick="window.modLibre('hex', -100)">-100</button><button class="btn-minus" style="background:#4a0000;" onclick="window.modLibre('hex', -500)">-500</button></div>
            </div>
            <div class="edit-card">
                <h4>Vida Roja (Actual)</h4>
                <div class="btn-row"><button class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 1)">+1 (Cura)</button><button class="btn-minus" onclick="window.modLibre('vidaRojaActual', -1)">-1 (Daño)</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 5)">+5 (Cura)</button><button class="btn-minus" onclick="window.modLibre('vidaRojaActual', -5)">-5 (Daño)</button></div>
            </div>
            <div class="edit-card">
                <h4>Corazones Azules</h4>
                <div class="btn-row"><button class="btn-plus" onclick="window.modLibre('vidaAzul', 1)">+1</button><button class="btn-minus" onclick="window.modLibre('vidaAzul', -1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus5" onclick="window.modLibre('vidaAzul', 5)">+5</button><button class="btn-minus5" onclick="window.modLibre('vidaAzul', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>Guarda Dorada</h4>
                <div class="btn-row"><button class="btn-plus" onclick="window.modLibre('guardaDorada', 1)">+1</button><button class="btn-minus" onclick="window.modLibre('guardaDorada', -1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus5" onclick="window.modLibre('guardaDorada', 5)">+5</button><button class="btn-minus5" onclick="window.modLibre('guardaDorada', -5)">-5</button></div>
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
            <input type="file" id="subir-csv" accept=".csv" style="display:none" onchange="window.subirAumentada(event)">
            <button onclick="document.getElementById('subir-csv').click()" class="btn-red">Subir CSV</button>
        </div>
        <div id="sub-vista-op"></div>
    `;
}

// Renderizador Universal de Tarjetas (Acepta Formulario Normal, Buffs o Edición Directa de NPCs)
function genCard(f, tipoAccion) {
    let btns = '';
    const clickMod = tipoAccion === 'buff' ? 'window.modificarBuff' : (tipoAccion === 'directo' ? 'window.modificarDirecto' : 'window.modForm');
    const visualVal = tipoAccion === 'buff' ? (f.val > 0 ? `+${f.val}` : f.val) : f.val;
    const colorStyle = tipoAccion === 'buff' ? (f.val > 0 ? 'color:#00ff00;' : (f.val < 0 ? 'color:red;' : 'color:var(--gold);')) : 'color:white;';

    if (f.esHex) {
        btns = `<div class="btn-row"><button class="btn-plus" onclick="${clickMod}('${f.id}', 50)">+50</button><button class="btn-minus" onclick="${clickMod}('${f.id}', -50)">-50</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${f.id}', 100)">+100</button><button class="btn-minus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${f.id}', -100)">-100</button></div>`;
    } else {
        btns = `<div class="btn-row"><button class="btn-plus" onclick="${clickMod}('${f.id}', 1)">+1</button><button class="btn-minus" onclick="${clickMod}('${f.id}', -1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus5" onclick="${clickMod}('${f.id}', 5)">+5</button><button class="btn-minus5" onclick="${clickMod}('${f.id}', -5)">-5</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${f.id}', 10)">+10</button><button class="btn-minus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${f.id}', -10)">-10</button></div>`;
    }

    let inputHtml = tipoAccion === 'form' 
        ? `<input type="number" id="${f.id}" value="${visualVal}" style="width:80%; text-align:center; background:#000; color:white; border:1px dashed var(--gold); margin-bottom:10px; font-size:1.5em; padding:5px;">`
        : `<span style="display:block; margin-bottom:10px; font-weight:bold; font-size:1.5em; ${colorStyle}">${visualVal}</span>`;

    return `<div class="edit-card"><h4>${f.label}</h4>${inputHtml}${btns}</div>`;
}

export function dibujarFormularioCrear() {
    const pEnergia = [ { id:'npc-hex', label:'HEX Inicial', val:0, esHex:true }, { id:'npc-vex', label:'VEX Inicial', val:0, esHex:true } ];
    const pVitalidad = [ { id:'npc-vra', label:'Corazones Actuales', val:10 }, { id:'npc-vrm', label:'Corazones (Límite Máx)', val:10 }, { id:'npc-va', label:'Corazones Azules', val:0 }, { id:'npc-gd', label:'Guarda Dorada', val:0 } ];
    const pOfensiva = [ { id:'npc-dr', label:'Daño Rojo', val:0 }, { id:'npc-da', label:'Daño Azul', val:0 }, { id:'npc-ed', label:'Elim. Dorada', val:0 } ];
    const pAfinidades = [ { id:'npc-fis', label:'Afin. Física', val:0 }, { id:'npc-ene', label:'Afin. Energética', val:0 }, { id:'npc-esp', label:'Afin. Espiritual', val:0 }, { id:'npc-man', label:'Afin. Mando', val:0 }, { id:'npc-psi', label:'Afin. Psíquica', val:0 }, { id:'npc-osc', label:'Afin. Oscura', val:0 } ];
    
    let html = `
    <div style="text-align:center; max-width:1000px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Forja de Personaje / NPC</h3>
        <input type="text" id="npc-nombre" placeholder="Nombre del NPC..." style="width:100%; max-width:400px; margin-bottom:20px; padding:10px; background:#000; color:var(--gold); border:1px solid var(--gold); font-size:1.2em; text-align:center;">
        
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">1. Energía</h3><div class="edit-grid" style="margin-bottom: 20px;">${pEnergia.map(f => genCard(f, 'form')).join('')}</div>
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">2. Vitalidad</h3><div class="edit-grid" style="margin-bottom: 20px;">${pVitalidad.map(f => genCard(f, 'form')).join('')}</div>
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">3. Ofensiva</h3><div class="edit-grid" style="margin-bottom: 20px;">${pOfensiva.map(f => genCard(f, 'form')).join('')}</div>
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">4. Afinidades</h3><div class="edit-grid" style="margin-bottom: 20px;">${pAfinidades.map(f => genCard(f, 'form')).join('')}</div>
        <button onclick="window.ejecutarCreacionNPC()" style="width:100%; max-width:400px; margin-top:30px; background:var(--gold); color:black; font-weight:bold; font-size:1.2em; padding:15px;">GUARDAR PERSONAJE</button>
    </div>`;
    return html;
}

export function dibujarFormularioEditar() {
    const p = statsGlobal[estadoUI.personajeSeleccionado];
    if(!p) return `<p>Selecciona un personaje en el catálogo primero.</p>`;

    // Separación por Grupos (Afinidades, Ofensiva, Vitalidad extra)
    const pVitalidad = [ { id: 'vidaRojaMaxExtra', label: 'Corazones Límite Extra', val: p.buffs.vidaRojaMaxExtra } ];
    const pOfensiva = [ { id: 'danoRojo', label: 'Daño Rojo Extra', val: p.buffs.danoRojo }, { id: 'danoAzul', label: 'Daño Azul Extra', val: p.buffs.danoAzul }, { id: 'elimDorada', label: 'Elim. Dorada Extra', val: p.buffs.elimDorada } ];
    const pAfinidades = [ { id: 'fisica', label: 'Afin. Física Extra', val: p.buffs.fisica }, { id: 'energetica', label: 'Afin. Energética Extra', val: p.buffs.energetica }, { id: 'espiritual', label: 'Afin. Espiritual Extra', val: p.buffs.espiritual }, { id: 'mando', label: 'Afin. Mando Extra', val: p.buffs.mando }, { id: 'psiquica', label: 'Afin. Psíquica Extra', val: p.buffs.psiquica }, { id: 'oscura', label: 'Afin. Oscura Extra', val: p.buffs.oscura } ];

    let html = `
    <div style="text-align:center; max-width:1000px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Alteración Temporal: ${estadoUI.personajeSeleccionado}</h3>
        <button onclick="window.abrirDetalle('${estadoUI.personajeSeleccionado}')" style="background:#444; margin-bottom: 15px;">⬅ Volver al Perfil</button>
        
        <div style="background:#111; border:1px dashed #d4af37; padding:15px; margin-bottom:20px; border-radius:8px; display:flex; justify-content:space-around;">
            <span style="font-size:1.2em;">❤️ Vida Límite Actual: <strong style="color:var(--red-life); font-size:1.5em;">${calcularVidaRojaMax(p)}</strong></span>
            <span style="font-size:1.2em;">🌀 VEX Máx Actual: <strong style="color:var(--blue-life); font-size:1.5em;">${calcularVexMax(p)}</strong></span>
        </div>`;

    // Si es un NPC creado a mano, mostramos un grupo exclusivo para alterar su HEX y VEX
    if (p.isNPC) {
        const pNPC = [ { id: 'hex', label: 'Subir/Bajar HEX', val: p.hex, esHex:true }, { id: 'vex', label: 'Subir/Bajar VEX', val: p.vex, esHex:true } ];
        html += `<h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">0. Energía Base (Exclusivo NPC)</h3>
                 <div class="edit-grid" style="margin-bottom: 20px;">${pNPC.map(f => genCard(f, 'directo')).join('')}</div>`;
    }

    html += `<h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">1. Vitalidad Límite</h3><div class="edit-grid" style="margin-bottom: 20px;">${pVitalidad.map(f => genCard(f, 'buff')).join('')}</div>
             <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">2. Ofensiva Extra</h3><div class="edit-grid" style="margin-bottom: 20px;">${pOfensiva.map(f => genCard(f, 'buff')).join('')}</div>
             <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">3. Afinidades Extra</h3><div class="edit-grid" style="margin-bottom: 20px;">${pAfinidades.map(f => genCard(f, 'buff')).join('')}</div>
    </div>`;

    return html;
}
