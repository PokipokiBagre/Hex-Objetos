import { misGlobal, jugadoresActivos, estadoUI, RECOMPENSAS_CLASE } from './mis-state.js';
import { removerJugador, guardarMision, eliminarPersonalizada } from './mis-logic.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/\s+/g,'_').replace(/[^a-z0-9ñ_]/g,'');

function getAfColor(af) {
    const colors = { 'Física': '#e2a673', 'Energética': '#f3b67a', 'Espiritual': '#7df0a7', 'Mando': '#a4d3f2', 'Psíquica': '#dcb1f0', 'Oscura': '#c285ff' };
    return colors[af] || '#fff';
}

export function dibujarRoster() {
    const container = document.getElementById('roster-jugadores');
    let html = '';
    jugadoresActivos.forEach(j => {
        const color = getAfColor(j.afinidad);
        html += `<img src="../img/imgpersonajes/${normalizar(j.icon)}icon.png" 
                      class="drag-char" 
                      style="border-color:${color}; box-shadow:0 0 8px ${color};"
                      title="${j.nombre} (Afinidad: ${j.afinidad})" 
                      draggable="true" 
                      ondragstart="window.dragStart(event, '${j.nombre}')" 
                      onerror="this.src='../img/imgobjetos/no_encontrado.png'">`;
    });
    container.innerHTML = html;
}

function renderBadgeEstado(estado) {
    if (estado === 0) return `<span class="estado-badge st-0">Inactiva</span>`;
    if (estado === 1) return `<span class="estado-badge st-1">Pendiente</span>`;
    if (estado === 2) return `<span class="estado-badge st-2">En Proceso</span>`;
    if (estado === 3) return `<span class="estado-badge st-3">Finalizada</span>`;
    return '';
}

function generarHTMLMision(m) {
    const btnEditar = (estadoUI.esAdmin || m.tipo === 'Personalizada') 
        ? `<button onclick="window.abrirModalEditar('${m.id}')" style="background:#222; border:1px solid #555; color:var(--gold); padding:4px 8px; font-size:0.7em; cursor:pointer; border-radius:4px;">✏️ Editar</button>` : '';
    const btnBorrar = (m.tipo === 'Personalizada' || estadoUI.esAdmin)
        ? `<button onclick="window.eliminarMis('${m.id}')" style="background:#4a0000; border:1px solid #ff4444; padding:4px 8px; font-size:0.7em; color:white; cursor:pointer; border-radius:4px;">🗑️</button>` : '';

    let htmlJugadores = '';
    m.jugadores.forEach(j => {
        const targetJug = jugadoresActivos.find(jug => jug.nombre === j);
        const icon = targetJug?.icon || j;
        const color = getAfColor(targetJug?.afinidad);
        htmlJugadores += `<div class="assigned-char" onclick="window.quitarJugador('${m.id}', '${j}')" title="Quitar a ${j}">
                            <img src="../img/imgpersonajes/${normalizar(icon)}icon.png" style="border-color:${color}" onerror="this.src='../img/imgobjetos/no_encontrado.png'">
                          </div>`;
    });

    const notaHTML = (estadoUI.esAdmin && m.notaOP) ? `<div style="background:#2e004f; padding:5px; border-left:3px solid var(--purple-magic); font-size:0.75em; margin-bottom:10px;"><b>OP:</b> ${m.notaOP}</div>` : '';

    // Color del contador si ya superó el cupo
    const isReady = m.cupos > 0 && m.jugadores.length >= m.cupos;
    const cuposColor = isReady ? 'var(--green-ok)' : '#888';

    return `
    <div class="mision-card">
        <div class="mision-header">
            <h3 class="mision-titulo" title="${m.titulo}">${m.titulo}</h3>
            <span class="mision-clase" title="${RECOMPENSAS_CLASE[m.clase] || ''}">CLASE ${m.clase}</span>
        </div>
        ${renderBadgeEstado(m.estado)}
        <div class="mision-meta">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%;">Autor: <span style="color:#aaa">${m.autor}</span></span>
            <span>Cupos: <b style="color:${cuposColor}">${m.jugadores.length}/${m.cupos === 0 ? '∞' : m.cupos}</b></span>
        </div>
        <div class="mision-desc" title="${m.desc}">${m.desc}</div>
        ${notaHTML}
        
        <div class="drop-zone" id="drop-${m.id}" ondragover="window.dragOver(event)" ondrop="window.dropPlayer(event, '${m.id}')" ondragleave="window.dragLeave(event)">
            ${htmlJugadores}
        </div>
        
        <div style="display:flex; justify-content:flex-end; gap:5px; margin-top:10px;">
            ${btnEditar}
            ${btnBorrar}
        </div>
    </div>`;
}

export function dibujarTablero() {
    let contGrandes = 0; let contNormales = 0;
    let htmlGrandes = ''; let htmlNormales = ''; let htmlPerso = ''; let htmlOP = '';

    misGlobal.forEach(m => {
        // Solo ocultamos las Finalizadas si el filtro está desactivado. Todas las Inactivas (0) SE MUESTRAN.
        if (!estadoUI.verFinalizadas && m.estado === 3) return; 

        if (m.estado === 1 || m.estado === 2) {
            if (m.tipo === 'Grande') contGrandes++;
            if (m.tipo === 'Normal') contNormales++;
        }

        const htmlCard = generarHTMLMision(m);
        
        if (m.tipo === 'Grande') htmlGrandes += htmlCard;
        else if (m.tipo === 'Normal') htmlNormales += htmlCard;
        else if (m.tipo === 'Personalizada') htmlPerso += htmlCard;
        else if (m.tipo === 'OP' && estadoUI.esAdmin) htmlOP += htmlCard;
    });

    document.getElementById('lista-grandes').innerHTML = htmlGrandes || '<p style="color:#666; font-style:italic;">No hay misiones disponibles.</p>';
    document.getElementById('lista-normales').innerHTML = htmlNormales || '<p style="color:#666; font-style:italic;">No hay misiones disponibles.</p>';
    document.getElementById('lista-perso').innerHTML = htmlPerso || '<p style="color:#666; font-style:italic;">No hay misiones creadas por jugadores.</p>';
    document.getElementById('lista-op').innerHTML = htmlOP;

    document.getElementById('count-grandes').innerText = contGrandes;
    document.getElementById('count-normales').innerText = contNormales;

    const colOP = document.getElementById('col-op');
    if(estadoUI.esAdmin) { colOP.classList.remove('oculto'); } else { colOP.classList.add('oculto'); }
}

export function actualizarBotonSync() {
    const btn = document.getElementById('btn-sync-global'); if(!btn) return;
    const statsChanges = Object.keys(estadoUI.colaCambios.misiones || {}).length;
    if (statsChanges > 0) {
        btn.classList.remove('oculto');
        btn.innerText = `🔥 GUARDAR CAMBIOS (${statsChanges}) 🔥`;
    } else {
        btn.classList.add('oculto');
    }
}

export function renderFormularioModal(mision = null) {
    const isEdit = mision !== null;
    const m = mision || { titulo:'', desc:'', autor:'', clase:'1', tipo:'Personalizada', estado:1, cupos:0, notaOP:'' };
    
    let tipoOptions = `<option value="Personalizada" ${m.tipo === 'Personalizada' ? 'selected' : ''}>Personalizada</option>`;
    if (estadoUI.esAdmin) {
        tipoOptions += `
            <option value="Grande" ${m.tipo === 'Grande' ? 'selected' : ''}>Grande</option>
            <option value="Normal" ${m.tipo === 'Normal' ? 'selected' : ''}>Normal</option>
            <option value="OP" ${m.tipo === 'OP' ? 'selected' : ''}>Idea OP</option>
        `;
    }

    const estadoDisabled = (!estadoUI.esAdmin && !isEdit) ? 'disabled' : '';

    const infoGuia = `
    <div class="modal-guide">
        <h4>📚 Guía de Recompensas por Clase</h4>
        <div class="guide-grid">
            <div><b>C1:</b> 600-1200 Hex<br>2 a 4 PA</div>
            <div><b>C2:</b> 1000-1800 Hex<br>3 a 6 PA</div>
            <div><b>C3:</b> 1500-2200 Hex<br>4 a 8 PA</div>
            <div><b>C4:</b> 2000-3000 Hex<br>5 a 10 PA</div>
            <div><b>C5:</b> 2500-3600 Hex<br>6 a 12 PA</div>
        </div>
        <p class="guide-warning">⚠️ Para misiones personalizadas: Los hechizos de recompensa DEBEN ser de la misma clase que la misión.</p>
    </div>`;

    return `
    <input type="hidden" id="form-id" value="${m.id || 'MIS_' + new Date().getTime()}">
    
    ${infoGuia}

    <div class="form-group">
        <label>Título de la Misión</label>
        <input type="text" id="form-titulo" class="form-input" value="${m.titulo}">
    </div>
    
    <div style="display:flex; gap:15px; flex-wrap:wrap;">
        <div class="form-group" style="flex:1; min-width:120px;">
            <label>Tipo</label>
            <select id="form-tipo" class="form-input" ${!estadoUI.esAdmin ? 'disabled' : ''}>
                ${tipoOptions}
            </select>
        </div>
        <div class="form-group" style="flex:1; min-width:120px;">
            <label>Clase de Dificultad</label>
            <select id="form-clase" class="form-input">
                ${[1,2,3,4,5].map(c => `<option value="${c}" ${parseInt(m.clase) === c ? 'selected' : ''}>Clase ${c}</option>`).join('')}
            </select>
        </div>
    </div>

    <div style="display:flex; gap:15px; flex-wrap:wrap;">
        <div class="form-group" style="flex:1; min-width:120px;">
            <label>Estado Inicial</label>
            <select id="form-estado" class="form-input" ${estadoDisabled}>
                <option value="0" ${m.estado === 0 ? 'selected' : ''}>Inactiva (Visible sin Detonar)</option>
                <option value="1" ${m.estado === 1 ? 'selected' : ''}>Pendiente (Activa)</option>
                <option value="2" ${m.estado === 2 ? 'selected' : ''}>En Proceso</option>
                <option value="3" ${m.estado === 3 ? 'selected' : ''}>Finalizada</option>
            </select>
        </div>
        <div class="form-group" style="flex:1; min-width:120px;">
            <label>Cupos Máximos (Detonador. 0 = Infinito)</label>
            <input type="number" id="form-cupos" class="form-input" value="${m.cupos}">
        </div>
    </div>

    <div class="form-group">
        <label>Autor / Patrocinador</label>
        <input type="text" id="form-autor" class="form-input" value="${m.autor}">
    </div>

    <div class="form-group">
        <label>Descripción y Recompensa de la Tarea</label>
        <textarea id="form-desc" class="form-input">${m.desc}</textarea>
    </div>

    ${estadoUI.esAdmin ? `
    <div class="form-group">
        <label style="color:var(--purple-magic);">Nota Interna OP (Invisible para jugadores)</label>
        <textarea id="form-notaOP" class="form-input" style="border-color:var(--purple-magic);">${m.notaOP}</textarea>
    </div>` : ''}

    <button onclick="window.ejecutarGuardarMision()" style="width:100%; background:var(--gold); color:#000; padding:15px; font-size:1.1em; border-radius:4px; font-weight:bold; cursor:pointer; font-family:'Cinzel'; transition:0.2s;">💾 GUARDAR MISIÓN</button>
    `;
}
