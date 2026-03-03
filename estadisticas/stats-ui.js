import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularVidaRojaMax, calcularVexMax } from './stats-logic.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
const calcTotal = (base, spells, buff) => (base || 0) + (spells || 0) + (buff || 0);

// DOBLE EXTRA SEPARADO (Dorado para hechizos, Verde/Rojo para Buffs)
const bTextSplit = (spells, buff) => {
    let html = '';
    if (spells !== 0) html += `<span style="color:#d4af37; font-size:0.65em; display:block; margin-top:2px; font-weight:bold;">(${spells > 0 ? '+' : ''}${spells})</span>`;
    if (buff !== 0) html += `<span style="color:${buff > 0 ? '#00ff00' : '#ff4444'}; font-size:0.65em; display:block; margin-top:2px; font-weight:bold;">(${buff > 0 ? '+' : ''}${buff})</span>`;
    return html;
};

const imgError = "this.onerror=null; this.src='../img/imgobjetos/no_encontrado.png'";

function asegurarEstructuras(p) {
    if(!p.buffs) p.buffs = {}; if(!p.hechizos) p.hechizos = {};
    if(!p.estados) p.estados = { veneno:0, radiacion:0, maldito:false, incapacitado:false, debilitado:false, angustia:false, petrificacion:false, secuestrado:false, huesos:false, comestible:false, cifrado:false, inversion:false, verde:false };
    const props = ['fisica', 'energetica', 'espiritual', 'mando', 'psiquica', 'oscura', 'danoRojo', 'danoAzul', 'elimDorada', 'vidaRojaMaxExtra', 'vidaAzulExtra', 'guardaDoradaExtra'];
    props.forEach(pr => { p.buffs[pr] = p.buffs[pr] || 0; p.hechizos[pr] = p.hechizos[pr] || 0; if (p.afinidades && p.afinidades[pr] === undefined) p.afinidades[pr] = 0; });
}

export function dibujarCatalogo() {
    const contenedor = document.getElementById('vista-catalogo'); let html = '';
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre]; const claseCarta = p.isPlayer ? 'player-card' : '';
        html += `<div class="char-card ${claseCarta}" onclick="window.abrirDetalle('${nombre}')"><img src="../img/imgpersonajes/${normalizar(nombre)}icon.png" onerror="${imgError}"><h3>${nombre}</h3><p>HEX: <strong>${p.hex}</strong> | VEX: <strong>${calcularVexMax(p)}</strong></p></div>`;
    }); contenedor.innerHTML = html;
}

export function dibujarDetalle() {
    const nombre = estadoUI.personajeSeleccionado; const p = statsGlobal[nombre];
    if(!p) return; asegurarEstructuras(p);
    const contenedor = document.getElementById('vista-detalle');

    let vidaRojaVisual = calcularVidaRojaMax(p);
    let vexVisual = calcularVexMax(p);
    let hexPercent = Math.min((p.hex / 4000) * 100, 100); let vexPercent = Math.min((vexVisual / 4000) * 100, 100);
    
    // VIDA ROJA
    let extraRojo = Math.max(0, p.vidaRojaActual - vidaRojaVisual);
    let normalRojo = Math.min(p.vidaRojaActual, vidaRojaVisual);
    let vaciosRojo = Math.max(0, vidaRojaVisual - normalRojo);
    let corazonesRojosHTML = ''; 
    for(let i=0; i<normalRojo; i++) corazonesRojosHTML += `<div class="heart-red"></div>`;
    for(let i=0; i<vaciosRojo; i++) corazonesRojosHTML += `<div class="heart-red empty"></div>`;
    for(let i=0; i<extraRojo; i++) corazonesRojosHTML += `<div class="heart-red" style="background:#800000; border:1px solid #ff0000; transform:scale(0.9);"></div>`;
    if (extraRojo > 0) corazonesRojosHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraRojo}</div>`;

    // VIDA AZUL (Consumibles: Base = Claros, Lo que exceda la base = Oscuros)
    const mysticTotal = (p.afinidades.espiritual||0) + (p.hechizos.espiritual||0) + (p.buffs.espiritual||0) + (p.afinidades.energetica||0) + (p.hechizos.energetica||0) + (p.buffs.energetica||0) + (p.afinidades.psiquica||0) + (p.hechizos.psiquica||0) + (p.buffs.psiquica||0) + (p.afinidades.mando||0) + (p.hechizos.mando||0) + (p.buffs.mando||0);
    const limitBaseAzul = (p.baseVidaAzul||0) + Math.floor(mysticTotal / 4);

    let normalAzul = Math.min(p.vidaAzul, limitBaseAzul);
    let extraAzul = Math.max(0, p.vidaAzul - limitBaseAzul);
    let corazonesAzulesHTML = ''; 
    for(let i=0; i<normalAzul; i++) corazonesAzulesHTML += `<div class="heart-blue"></div>`;
    for(let i=0; i<extraAzul; i++) corazonesAzulesHTML += `<div class="heart-blue" style="background:#1a4b8c; border:1px solid #4a90e2; transform:scale(0.9);"></div>`;
    if (extraAzul > 0) corazonesAzulesHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraAzul}</div>`;

    // GUARDA DORADA (Consumibles: Base = Claros, Lo que exceda la base = Oscuros)
    let limitBaseGuarda = p.baseGuardaDorada || 0;
    let normalGuarda = Math.min(p.guardaDorada, limitBaseGuarda);
    let extraGuarda = Math.max(0, p.guardaDorada - limitBaseGuarda);
    let guardasHTML = ''; 
    for(let i=0; i<normalGuarda; i++) guardasHTML += `<div class="guard-gold"></div>`;
    for(let i=0; i<extraGuarda; i++) guardasHTML += `<div class="guard-gold" style="background:#8b6508; border:1px solid #d4af37; transform: rotate(45deg) scale(0.8);"></div>`;
    if (extraGuarda > 0) guardasHTML += `<div style="width:100%; font-size:0.8em; color:gray; margin-top:5px; font-weight:bold;">Extra: +${extraGuarda}</div>`;

    let estadosHTML = ''; let descEstadosHTML = ''; const st = p.estados;
    if(st.veneno > 0) { estadosHTML += `<div class="status-badge badge-veneno">Veneno (${st.veneno})</div>`; descEstadosHTML += `<p><strong>Veneno (${st.veneno}):</strong> El objetivo pierde ${st.veneno} corazones rojos cada turno.</p>`; }
    if(st.radiacion > 0) { estadosHTML += `<div class="status-badge badge-radiacion">Radiación (${st.radiacion})</div>`; descEstadosHTML += `<p><strong>Radiación (${st.radiacion}):</strong> Recibe ${st.radiacion} de daño rojo constante y ${st.radiacion} de daño azul al lanzar hechizos. Riesgo de autocastear Cáncer.</p>`; }
    if(st.maldito) { estadosHTML += `<div class="status-badge badge-maldito">Maldito</div>`; descEstadosHTML += `<p><strong>Maldito:</strong> Prohíbe al objetivo adquirir corazones extra.</p>`; }
    if(st.incapacitado) { estadosHTML += `<div class="status-badge badge-incapacitado">Incapacitado</div>`; descEstadosHTML += `<p><strong>Incapacitado:</strong> El daño por Ataques Simples se reduce a 0.</p>`; }
    if(st.debilitado) { estadosHTML += `<div class="status-badge badge-debilitado">Debilitado</div>`; descEstadosHTML += `<p><strong>Debilitado:</strong> Si recibe daño rojo, ese daño se duplica automáticamente.</p>`; }
    if(st.angustia) { estadosHTML += `<div class="status-badge badge-angustia">Angustia</div>`; descEstadosHTML += `<p><strong>Angustia:</strong> Aumenta el costo de casteo de hechizos en 500 HEX.</p>`; }
    if(st.petrificacion) { estadosHTML += `<div class="status-badge badge-petrificacion">Petrificación</div>`; descEstadosHTML += `<p><strong>Petrificación:</strong> Inmovilización total.</p>`; }
    if(st.secuestrado) { estadosHTML += `<div class="status-badge badge-secuestrado">Secuestrado</div>`; descEstadosHTML += `<p><strong>Secuestrado:</strong> Retirado de la acción.</p>`; }
    if(st.huesos) { estadosHTML += `<div class="status-badge badge-huesos">En los Huesos</div>`; descEstadosHTML += `<p><strong>En los Huesos:</strong> La vida se pierde en bloques fijos de 3, 7 o 13.</p>`; }
    if(st.comestible) { estadosHTML += `<div class="status-badge badge-comestible">Comestible</div>`; descEstadosHTML += `<p><strong>Comestible:</strong> Unifica barras. Entrega 3 corazones a aliados y 5 a enemigos al ser atacado.</p>`; }
    if(st.cifrado) { estadosHTML += `<div class="status-badge badge-cifrado">Cifrado</div>`; descEstadosHTML += `<p><strong>Cifrado:</strong> Genera 10 de HEX por palabra "cifrada" (Tope 1200).</p>`; }
    if(st.inversion) { estadosHTML += `<div class="status-badge badge-inversion">Inversión</div>`; descEstadosHTML += `<p><strong>Inversión:</strong> La curación se transforma en daño.</p>`; }
    if(st.verde) { estadosHTML += `<div class="status-badge badge-verde">Verde</div>`; descEstadosHTML += `<p><strong>Verde:</strong> Permite reciclar objetos para ganar 20 de HEX.</p>`; }
    let bloqueDescripciones = descEstadosHTML !== '' ? `<div style="margin-top:10px; padding:10px 15px; background:rgba(0,0,0,0.5); border-left:3px solid var(--gold); font-size:0.85em; color:#ccc; border-radius:4px; text-align:left;">${descEstadosHTML}</div>` : '';

    let html = `
    <div style="display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #d4af37; padding-bottom: 20px;">
        <img src="../img/imgpersonajes/${normalizar(nombre)}icon.png" style="width: 120px; border-radius: 50%; border: 3px solid #d4af37;" onerror="${imgError}">
        <div style="text-align:left;"><h1 style="margin: 0;">${nombre.toUpperCase()} ${p.isNPC ? '<span style="font-size:0.4em; color:#aaa">[NPC]</span>' : ''}</h1><div class="status-container">${estadosHTML}</div></div>
        ${estadoUI.esAdmin ? `<button onclick="window.mostrarPaginaOP('editar')" style="margin-left:auto; background:#1a0033; border-color:#d4af37;">Editar Ficha Base</button>` : ''}
    </div> ${bloqueDescripciones}

    <div class="circle-wrap"><div class="stat-circle" style="background: conic-gradient(var(--gold) ${hexPercent}%, #222 0);"><div class="inner"><strong>${p.hex}</strong><span>HEX</span></div></div><div class="stat-circle" style="background: conic-gradient(var(--blue-life) ${vexPercent}%, #222 0);"><div class="inner"><strong>${vexVisual}</strong><span>VEX</span></div></div></div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div>
            <h3 style="margin-top:0;">Vitalidad</h3>
            <div class="health-box"><label style="color:var(--red-life);">VIDA ROJA (${p.vidaRojaActual}/${vidaRojaVisual})</label><div class="health-grid">${corazonesRojosHTML}</div></div>
            <div class="health-box"><label style="color:var(--blue-life);">VIDA AZUL (${p.vidaAzul})</label><div class="health-grid">${corazonesAzulesHTML}</div></div>
            <div class="health-box"><label style="color:var(--gold);">GUARDA DORADA (${p.guardaDorada})</label><div class="health-grid">${guardasHTML}</div></div>
            
            <h3 style="margin-top:20px;">Ofensiva Totales</h3>
            <div class="affinities-grid">
                <div class="affinity-box"><label style="color:var(--red-life)">Daño Rojo</label><span style="font-size:1.4em;">${calcTotal(p.danoRojo, p.hechizos.danoRojo, p.buffs.danoRojo)}</span>${bTextSplit(p.hechizos.danoRojo, p.buffs.danoRojo)}</div>
                <div class="affinity-box"><label style="color:var(--blue-life)">Daño Azul</label><span style="font-size:1.4em;">${calcTotal(p.danoAzul, p.hechizos.danoAzul, p.buffs.danoAzul)}</span>${bTextSplit(p.hechizos.danoAzul, p.buffs.danoAzul)}</div>
                <div class="affinity-box"><label style="color:var(--gold)">Elim. Dorada</label><span style="font-size:1.4em;">${calcTotal(p.elimDorada, p.hechizos.elimDorada, p.buffs.elimDorada)}</span>${bTextSplit(p.hechizos.elimDorada, p.buffs.elimDorada)}</div>
            </div>
        </div>
        <div>
            <h3 style="margin-top:0;">Afinidades Totales</h3>
            <div class="affinities-grid">
                <div class="affinity-box"><label>Física</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.fisica, p.hechizos.fisica, p.buffs.fisica)}</span>${bTextSplit(p.hechizos.fisica, p.buffs.fisica)}</div>
                <div class="affinity-box"><label>Energética</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.energetica, p.hechizos.energetica, p.buffs.energetica)}</span>${bTextSplit(p.hechizos.energetica, p.buffs.energetica)}</div>
                <div class="affinity-box"><label>Espiritual</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.espiritual, p.hechizos.espiritual, p.buffs.espiritual)}</span>${bTextSplit(p.hechizos.espiritual, p.buffs.espiritual)}</div>
                <div class="affinity-box"><label>Mando</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.mando, p.hechizos.mando, p.buffs.mando)}</span>${bTextSplit(p.hechizos.mando, p.buffs.mando)}</div>
                <div class="affinity-box"><label>Psíquica</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.psiquica, p.hechizos.psiquica, p.buffs.psiquica)}</span>${bTextSplit(p.hechizos.psiquica, p.buffs.psiquica)}</div>
                <div class="affinity-box"><label>Oscura</label><span style="font-size:1.4em;">${calcTotal(p.afinidades.oscura, p.hechizos.oscura, p.buffs.oscura)}</span>${bTextSplit(p.hechizos.oscura, p.buffs.oscura)}</div>
            </div>
        </div>
    </div>
    
    <div style="margin-top:30px; background:#0a0014; border:1px solid var(--gold); padding:20px; border-radius:8px;">
        <h3 style="margin-top:0; color:var(--gold); text-align:center;">Acciones Rápidas (Vida y Energía)</h3>
        <div class="edit-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
            <div class="edit-card">
                <h4>Ganancia HEX</h4>
                <div class="btn-row"><button class="btn-plus" onclick="window.modLibre('hex', 1)">+1</button><button class="btn-minus" onclick="window.modLibre('hex', -1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus" onclick="window.modLibre('hex', 10)">+10</button><button class="btn-minus" onclick="window.modLibre('hex', -10)">-10</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#004a4a;" onclick="window.modLibre('hex', 50)">+50</button><button class="btn-minus" style="background:#4a0000;" onclick="window.modLibre('hex', -50)">-50</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#004a4a;" onclick="window.modLibre('hex', 100)">+100</button><button class="btn-minus" style="background:#4a0000;" onclick="window.modLibre('hex', -100)">-100</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#4a004a;" onclick="window.modLibre('hex', 500)">+500</button><button class="btn-plus" style="background:#4a004a;" onclick="window.modLibre('hex', 1000)">+1000</button></div>
            </div>
            <div class="edit-card">
                <h4>Vida Roja (Actual)</h4>
                <div class="btn-row"><button class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 1)">+1 (Cura)</button><button class="btn-minus" onclick="window.modLibre('vidaRojaActual', -1)">-1 (Daño)</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#004a00" onclick="window.modLibre('vidaRojaActual', 5)">+5 (Cura)</button><button class="btn-minus" onclick="window.modLibre('vidaRojaActual', -5)">-5 (Daño)</button></div>
            </div>
            <div class="edit-card">
                <h4>Corazones Azules Base</h4>
                <div class="btn-row"><button class="btn-plus" onclick="window.modLibre('vidaAzul', 1)">+1</button><button class="btn-minus" onclick="window.modLibre('vidaAzul', -1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus5" onclick="window.modLibre('vidaAzul', 5)">+5</button><button class="btn-minus5" onclick="window.modLibre('vidaAzul', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>C. Azules <span style="color:#00ff00">(EXTRA)</span></h4>
                <div class="btn-row"><button class="btn-plus" style="background:#330066;" onclick="window.modBlueExtra(1)">+1</button><button class="btn-minus" onclick="window.modBlueExtra(-1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus5" style="background:#004a4a;" onclick="window.modBlueExtra(5)">+5</button><button class="btn-minus5" onclick="window.modBlueExtra(-5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>Guarda Dorada Base</h4>
                <div class="btn-row"><button class="btn-plus" onclick="window.modLibre('guardaDorada', 1)">+1</button><button class="btn-minus" onclick="window.modLibre('guardaDorada', -1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus5" onclick="window.modLibre('guardaDorada', 5)">+5</button><button class="btn-minus5" onclick="window.modLibre('guardaDorada', -5)">-5</button></div>
            </div>
            <div class="edit-card">
                <h4>Guarda Dorada <span style="color:#00ff00">(EXTRA)</span></h4>
                <div class="btn-row"><button class="btn-plus" style="background:#330066;" onclick="window.modGoldExtra(1)">+1</button><button class="btn-minus" onclick="window.modGoldExtra(-1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus5" style="background:#004a4a;" onclick="window.modGoldExtra(5)">+5</button><button class="btn-minus5" onclick="window.modGoldExtra(-5)">-5</button></div>
            </div>
        </div>
    </div>`;

    const pVidaDanoE = [ { id: 'vidaRojaMaxExtra', label: 'Límite Rojo Extra', val: p.buffs.vidaRojaMaxExtra }, { id: 'danoRojo', label: 'Daño Rojo Extra', val: p.buffs.danoRojo }, { id: 'danoAzul', label: 'Daño Azul Extra', val: p.buffs.danoAzul }, { id: 'elimDorada', label: 'Elim. Dorada Extra', val: p.buffs.elimDorada } ];
    const pAfinidadesE = [ { id: 'fisica', label: 'Afin. Física Extra', val: p.buffs.fisica }, { id: 'energetica', label: 'Afin. Energética Extra', val: p.buffs.energetica }, { id: 'espiritual', label: 'Afin. Espiritual Extra', val: p.buffs.espiritual }, { id: 'mando', label: 'Afin. Mando Extra', val: p.buffs.mando }, { id: 'psiquica', label: 'Afin. Psíquica Extra', val: p.buffs.psiquica }, { id: 'oscura', label: 'Afin. Oscura Extra', val: p.buffs.oscura } ];

    html += `
    <div style="margin-top:20px; background:#110022; border:1px solid #00ffff; padding:20px; border-radius:8px;">
        <h3 style="margin-top:0; color:#00ffff; text-align:center;">Alteraciones Temporales (Extras)</h3>
        <p style="color:#aaa; font-size:0.85em; text-align:center; margin-bottom:20px;">Estos valores se suman como "Buffs" a la base y a los hechizos.</p>
        <h4 style="color:#fff; border-bottom:1px dashed #004a4a; padding-bottom:5px; text-align:left; margin-bottom:15px; font-family:'Cinzel', serif;">1. Buffs de Vida y Daño</h4>
        <div class="edit-grid" style="margin-bottom: 30px;">${pVidaDanoE.map(f => genCard(f, 'buff')).join('')}</div>
        <h4 style="color:#fff; border-bottom:1px dashed #004a4a; padding-bottom:5px; text-align:left; margin-bottom:15px; font-family:'Cinzel', serif;">2. Afinidades Temporales</h4>
        <div class="edit-grid" style="margin-bottom: 10px;">${pAfinidadesE.map(f => genCard(f, 'buff')).join('')}</div>
    </div>`;

    let opcionesPersonajes = Object.keys(statsGlobal).filter(n => n !== nombre).map(n => `<option value="${n}">${n}</option>`).join('');
    html += `
    <div style="margin-top:20px; background:#1a0033; border:1px dashed #d4af37; padding:15px; border-radius:8px; text-align:center;">
        <h3 style="margin-top:0; color:var(--gold);">Importación de Estados</h3>
        <p style="color:#aaa; font-size:0.85em; margin-bottom:10px;">Importa los estados alterados o clona toda la ficha <b>desde</b> otro personaje hacia <b>${nombre}</b>.</p>
        <div style="display:flex; justify-content:center; align-items:center; gap:10px; flex-wrap:wrap;">
            <select id="clon-source" style="padding:10px; background:#000; color:white; border:1px solid var(--gold); font-family:'Cinzel'; min-width:200px;">
                <option value="" disabled selected>-- Selecciona Origen --</option>${opcionesPersonajes}
            </select>
            <button onclick="window.ejecutarClonacion('estados')" style="background:#004a4a; border:1px solid #00ffff; padding:10px 15px; color:white; font-weight:bold; transition:0.2s;">Importar Estados Alterados</button>
            <button onclick="window.ejecutarClonacion('completo')" style="background:#4a0000; border:1px solid #ff4444; padding:10px 15px; color:white; font-weight:bold; transition:0.2s;">Clonar por Completo</button>
        </div>
    </div>`;

    contenedor.innerHTML = html;
}

export function dibujarMenuOP() {
    return `
        <h3>PANEL DE OPERADOR</h3>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;">
            <button onclick="window.mostrarPaginaOP('crear')" style="background:#004a4a">Crear NPC (Manual)</button>
            <button onclick="window.descargarAumentada()">Descargar CSV</button>
            <button onclick="window.triggerSubirCSV()" class="btn-red">Subir CSV</button>
        </div>
        <div id="sub-vista-op"></div>
    `;
}

function genCard(f, tipoAccion) {
    let btns = ''; let clickMod = '';
    if (tipoAccion === 'buff') clickMod = 'window.modificarBuff';
    else if (tipoAccion === 'directo') clickMod = 'window.modificarDirecto';
    else if (tipoAccion === 'baseTop') clickMod = 'window.modBaseTop';
    else if (tipoAccion === 'baseAfin') clickMod = 'window.modBaseAfin';
    else if (tipoAccion === 'spellTop') clickMod = 'window.modSpellTop';
    else if (tipoAccion === 'spellAfin') clickMod = 'window.modSpellAfin';
    else if (tipoAccion === 'form') clickMod = 'window.modForm';

    const visualVal = f.val !== undefined ? f.val : 0;
    const attrInput = `onchange="window.cambioManual('${f.id}', this.value, '${tipoAccion}')"`;
    let inputHtml = `<input type="number" id="inp-${tipoAccion}-${f.id}" value="${visualVal}" ${attrInput} style="width:80%; text-align:center; background:#000; color:white; border:1px dashed var(--gold); margin-bottom:10px; font-size:1.5em; padding:5px; box-sizing:border-box;">`;

    if (f.esHex) {
        btns = `<div class="btn-row"><button class="btn-plus" onclick="${clickMod}('${f.id}', 10)">+10</button><button class="btn-minus" onclick="${clickMod}('${f.id}', -10)">-10</button></div>
                <div class="btn-row"><button class="btn-plus" onclick="${clickMod}('${f.id}', 50)">+50</button><button class="btn-minus" onclick="${clickMod}('${f.id}', -50)">-50</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${f.id}', 100)">+100</button><button class="btn-minus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${f.id}', -100)">-100</button></div>`;
    } else {
        btns = `<div class="btn-row"><button class="btn-plus" onclick="${clickMod}('${f.id}', 1)">+1</button><button class="btn-minus" onclick="${clickMod}('${f.id}', -1)">-1</button></div>
                <div class="btn-row"><button class="btn-plus5" onclick="${clickMod}('${f.id}', 5)">+5</button><button class="btn-minus5" onclick="${clickMod}('${f.id}', -5)">-5</button></div>
                <div class="btn-row"><button class="btn-plus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${f.id}', 10)">+10</button><button class="btn-minus" style="background:#4a004a; border-color:#8a008a;" onclick="${clickMod}('${f.id}', -10)">-10</button></div>`;
    }
    return `<div class="edit-card"><h4>${f.label}</h4>${inputHtml}${btns}</div>`;
}

export function dibujarFormularioCrear() {
    const pEnergia = [ { id:'npc-hex', label:'HEX Inicial', val:0, esHex:true }, { id:'npc-vex', label:'VEX Inicial', val:0, esHex:true } ];
    const pVidaDano = [ { id:'npc-vra', label:'Corazones Actuales', val:10 }, { id:'npc-vrm', label:'Corazones (Límite Máx)', val:10 }, { id:'npc-va', label:'Corazones Azules', val:0 }, { id:'npc-gd', label:'Guarda Dorada', val:0 }, { id:'npc-dr', label:'Daño Rojo', val:0 }, { id:'npc-da', label:'Daño Azul', val:0 }, { id:'npc-ed', label:'Elim. Dorada', val:0 } ];
    const pAfinidades = [ { id:'npc-fis', label:'Afin. Física', val:0 }, { id:'npc-ene', label:'Afin. Energética', val:0 }, { id:'npc-esp', label:'Afin. Espiritual', val:0 }, { id:'npc-man', label:'Afin. Mando', val:0 }, { id:'npc-psi', label:'Afin. Psíquica', val:0 }, { id:'npc-osc', label:'Afin. Oscura', val:0 } ];
    
    return `
    <div style="text-align:center; max-width:1000px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Forja de Personaje / NPC</h3>
        <input type="text" id="npc-nombre" placeholder="Nombre del NPC..." style="width:100%; max-width:400px; margin-bottom:20px; padding:10px; background:#000; color:var(--gold); border:1px solid var(--gold); font-size:1.2em; text-align:center;">
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">1. Energía Base</h3><div class="edit-grid" style="margin-bottom: 20px;">${pEnergia.map(f => genCard(f, 'form')).join('')}</div>
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">2. Vitalidad y Ofensiva Base</h3><div class="edit-grid" style="margin-bottom: 20px;">${pVidaDano.map(f => genCard(f, 'form')).join('')}</div>
        <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">3. Afinidades Base</h3><div class="edit-grid" style="margin-bottom: 20px;">${pAfinidades.map(f => genCard(f, 'form')).join('')}</div>
        <button onclick="window.ejecutarCreacionNPC()" style="width:100%; max-width:400px; margin-top:30px; background:var(--gold); color:black; font-weight:bold; font-size:1.2em; padding:15px;">GUARDAR PERSONAJE</button>
    </div>`;
}

export function dibujarFormularioEditar() {
    const p = statsGlobal[estadoUI.personajeSeleccionado];
    if(!p) return `<p>Selecciona un personaje en el catálogo primero.</p>`;
    asegurarEstructuras(p);
    
    const pVidaDanoBase = [ { id: 'vidaRojaMax', label: 'Límite Rojo Base', val: p.vidaRojaMax }, { id: 'baseVidaAzul', label: 'C. Azules Base', val: p.baseVidaAzul }, { id: 'baseGuardaDorada', label: 'G. Dorada Base', val: p.baseGuardaDorada }, { id: 'danoRojo', label: 'Daño Rojo Base', val: p.danoRojo }, { id: 'danoAzul', label: 'Daño Azul Base', val: p.danoAzul }, { id: 'elimDorada', label: 'Elim. Dorada Base', val: p.elimDorada } ];
    const pAfinidadesBase = [ { id: 'fisica', label: 'Física Base', val: p.afinidades.fisica }, { id: 'energetica', label: 'Energética Base', val: p.afinidades.energetica }, { id: 'espiritual', label: 'Espiritual Base', val: p.afinidades.espiritual }, { id: 'mando', label: 'Mando Base', val: p.afinidades.mando }, { id: 'psiquica', label: 'Psíquica Base', val: p.afinidades.psiquica }, { id: 'oscura', label: 'Oscura Base', val: p.afinidades.oscura } ];

    const pVitalidadSpell = [ { id: 'vidaRojaMaxExtra', label: 'Límite Rojo (Hechizo)', val: p.hechizos.vidaRojaMaxExtra } ];
    const pAfinidadesSpell = [ { id: 'fisica', label: 'Física (Hechizo)', val: p.hechizos.fisica }, { id: 'energetica', label: 'Energética (Hechizo)', val: p.hechizos.energetica }, { id: 'espiritual', label: 'Espiritual (Hechizo)', val: p.hechizos.espiritual }, { id: 'mando', label: 'Mando (Hechizo)', val: p.hechizos.mando }, { id: 'psiquica', label: 'Psíquica (Hechizo)', val: p.hechizos.psiquica }, { id: 'oscura', label: 'Oscura (Hechizo)', val: p.hechizos.oscura } ];

    let html = `
    <div style="text-align:center; max-width:1000px; margin:0 auto;">
        <h3 style="margin-top:0; color:var(--gold)">Edición de Ficha Base y Hechizos: ${estadoUI.personajeSeleccionado}</h3>
        <button onclick="window.abrirDetalle('${estadoUI.personajeSeleccionado}')" style="background:#444; margin-bottom: 15px;">⬅ Volver al Perfil</button>
        
        <div style="background:#0a0014; border:1px solid var(--gold); padding:15px; margin-bottom:20px; border-radius:8px; display:flex; flex-wrap:wrap; justify-content:center; gap:15px; font-size:1.1em;">
            <div style="width:100%; text-align:center; color:#aaa; font-size:0.8em; margin-bottom:5px;">VISTA DE TOTALES (Incluye Base, Hechizos y Extras)</div>
            <span>Física: <b style="color:var(--gold)">${calcTotal(p.afinidades.fisica, p.hechizos.fisica, p.buffs.fisica)}</b></span>
            <span>Energética: <b style="color:var(--gold)">${calcTotal(p.afinidades.energetica, p.hechizos.energetica, p.buffs.energetica)}</b></span>
            <span>Espiritual: <b style="color:var(--gold)">${calcTotal(p.afinidades.espiritual, p.hechizos.espiritual, p.buffs.espiritual)}</b></span>
            <span>Mando: <b style="color:var(--gold)">${calcTotal(p.afinidades.mando, p.hechizos.mando, p.buffs.mando)}</b></span>
            <span>Psíquica: <b style="color:var(--gold)">${calcTotal(p.afinidades.psiquica, p.hechizos.psiquica, p.buffs.psiquica)}</b></span>
            <span>Oscura: <b style="color:var(--gold)">${calcTotal(p.afinidades.oscura, p.hechizos.oscura, p.buffs.oscura)}</b></span>
        </div>
        `;

    if (p.isNPC) {
        const pNPC = [ { id: 'hex', label: 'Base HEX', val: p.hex, esHex:true }, { id: 'vex', label: 'Base VEX', val: p.vex, esHex:true } ];
        html += `<h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">0. Energía Base (NPC)</h3><div class="edit-grid" style="margin-bottom: 20px;">${pNPC.map(f => genCard(f, 'directo')).join('')}</div>`;
    }

    const st = p.estados;
    const sBool = [ { id: 'maldito', label: 'Maldito' }, { id: 'incapacitado', label: 'Incapacitado' }, { id: 'debilitado', label: 'Debilitado' }, { id: 'angustia', label: 'Angustia' }, { id: 'petrificacion', label: 'Petrificación' }, { id: 'secuestrado', label: 'Secuestrado' }, { id: 'huesos', label: 'En los Huesos' }, { id: 'comestible', label: 'Comestible' }, { id: 'cifrado', label: 'Cifrado' }, { id: 'inversion', label: 'Inversión' }, { id: 'verde', label: 'Verde' } ];

    html += `<h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top:30px;">Efectos de Estado</h3>
             <div class="edit-grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); margin-bottom:20px;">
                <div class="edit-card"><h4>Veneno</h4><span style="color:#00ff00; font-size:1.5em; font-weight:bold;">${st.veneno}</span><div class="btn-row"><button class="btn-plus" onclick="window.modEstado('veneno', 1)">+1</button><button class="btn-minus" onclick="window.modEstado('veneno', -1)">-1</button></div></div>
                <div class="edit-card"><h4>Radiación</h4><span style="color:#ffff00; font-size:1.5em; font-weight:bold;">${st.radiacion}</span><div class="btn-row"><button class="btn-plus" onclick="window.modEstado('radiacion', 1)">+1</button><button class="btn-minus" onclick="window.modEstado('radiacion', -1)">-1</button></div></div>`;
    sBool.forEach(s => { html += `<button class="status-toggle ${st[s.id] ? 'active' : ''}" onclick="window.toggleEstado('${s.id}')">${s.label}</button>`; });
    html += `</div>`;

    html += `<div style="border:1px solid #4a004a; padding:15px; margin-bottom:20px; border-radius:8px;">
                <h2 style="color:var(--gold); margin-top:0;">Cambiar Original (Valores Base Permanentes)</h2>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Vitalidad y Ofensiva Base</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pVidaDanoBase.map(f => genCard(f, 'baseTop')).join('')}</div>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Afinidades Base</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pAfinidadesBase.map(f => genCard(f, 'baseAfin')).join('')}</div>
             </div>
             
             <div style="border:1px solid #004a4a; padding:15px; margin-bottom:20px; border-radius:8px;">
                <h2 style="color:#00ffff; margin-top:0;">Cambiar Cantidad por Hechizos</h2>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Vitalidad por Hechizos</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pVitalidadSpell.map(f => genCard(f, 'spellTop')).join('')}</div>
                <h3 style="color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px; text-align:left;">Afinidades por Hechizos</h3>
                <div class="edit-grid" style="margin-bottom: 20px;">${pAfinidadesSpell.map(f => genCard(f, 'spellAfin')).join('')}</div>
             </div>
    </div>`;

    return html;
}
