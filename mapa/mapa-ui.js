import { estadoMapa, COLOR_AFINIDAD, ESTETICA } from './mapa-state.js';

let canvas, ctx;

export function inicializarCanvas() {
    canvas = document.getElementById('mapa-canvas');
    if(!canvas) return;
    ctx = canvas.getContext('2d', { alpha: false });
    redimensionar();
    window.addEventListener('resize', redimensionar);
}

function redimensionar() {
    if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    dibujarFrame();
}

export function dibujarFrame() {
    if(!ctx) return;
    const { nodos, enlaces, camara, interaccion } = estadoMapa;

    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#05000a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    ctx.translate(camara.x, camara.y);
    ctx.scale(camara.zoom, camara.zoom);

    const scaleFactor = Math.max(camara.zoom, 0.4);
    
    const nodoActivo = interaccion.selectedNode || interaccion.hoveredNode;

    // 1. DIBUJAR ENLACES (Lógica de Colores Direccionales)
    enlaces.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const angle = Math.atan2(dy, dx);
        
        const targetX = link.target.x - Math.cos(angle) * (link.target.radio + (4/scaleFactor));
        const targetY = link.target.y - Math.sin(angle) * (link.target.radio + (4/scaleFactor));

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(targetX, targetY);
        
        // Asignación de Estética de Rol
        if (nodoActivo) {
            if (link.source === nodoActivo) {
                // SALIENTE: Amarillo Dorado
                ctx.strokeStyle = ESTETICA.lineaSaliente;
                ctx.lineWidth = 6 / scaleFactor;
                ctx.setLineDash([]);
            } else if (link.target === nodoActivo) {
                // PRECEDENTE: Morado Violeta
                ctx.strokeStyle = ESTETICA.lineaPrecedente;
                ctx.lineWidth = 6 / scaleFactor;
                ctx.setLineDash([]);
            } else {
                // Otras líneas se oscurecen
                ctx.strokeStyle = ESTETICA.lineaBase;
                ctx.lineWidth = 1.5 / scaleFactor; 
                ctx.setLineDash([]);
            }
        } else {
            // Estado Normal sin interacción
            ctx.strokeStyle = link.target.arrowColor || ESTETICA.lineaBase; 
            ctx.lineWidth = 2.5 / scaleFactor; 
            
            // Segmentación para nodos no descubiertos
            if (ctx.strokeStyle !== ESTETICA.lineaBase && ctx.strokeStyle !== ESTETICA.lineaNoDescubierto) {
                ctx.setLineDash([12 / scaleFactor, 8 / scaleFactor]);
            } else {
                ctx.setLineDash([]);
            }
        }

        ctx.stroke();
        ctx.setLineDash([]); 

        const headlen = 16 / scaleFactor;
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - headlen * Math.cos(angle - Math.PI / 7), targetY - headlen * Math.sin(angle - Math.PI / 7));
        ctx.lineTo(targetX - headlen * Math.cos(angle + Math.PI / 7), targetY - headlen * Math.sin(angle + Math.PI / 7));
        ctx.lineTo(targetX, targetY);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
    });

    // 2. DIBUJAR NODOS
    nodos.forEach(nodo => {
        let colorAf = COLOR_AFINIDAD[nodo.afinidad] || '#888';
        if (!nodo.esConocido) colorAf = '#777'; 
        if (nodo.isHexNode) colorAf = '#ff4444'; 
        
        const isHovered = interaccion.hoveredNode === nodo;
        const isSelected = interaccion.selectedNode === nodo;
        
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(nodo.x, nodo.y, nodo.radio + (8/scaleFactor), 0, Math.PI * 2);
            ctx.strokeStyle = ESTETICA.lineaSaliente; // Aura dorada al seleccionar
            ctx.lineWidth = 3 / scaleFactor;
            ctx.setLineDash([8/scaleFactor, 8/scaleFactor]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.arc(nodo.x, nodo.y, nodo.radio, 0, Math.PI * 2);
        
        ctx.shadowBlur = (isHovered || isSelected) ? 35 : (nodo.isHexNode ? 30 : (nodo.esConocido ? 5 : 0));
        ctx.shadowColor = colorAf;

        if (nodo.isHexNode) {
            ctx.fillStyle = '#4a0000';
        } else if (nodo.esConocido) {
            ctx.fillStyle = (isHovered || isSelected) ? '#333' : '#111';
        } else {
            ctx.fillStyle = (isHovered || isSelected) ? '#444' : '#222'; 
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.lineWidth = ((isHovered || isSelected) ? 4 : 2) / scaleFactor;
        ctx.strokeStyle = colorAf;
        
        if (!nodo.esConocido && !nodo.isHexNode) {
            ctx.setLineDash([6 / scaleFactor, 4 / scaleFactor]);
        }
        ctx.stroke();
        ctx.setLineDash([]); 

        // 3. TEXTOS (Aumentado y mejorado)
        if (camara.zoom > 0.15 || isHovered || isSelected || nodo.isHexNode) {
            // ETIQUETAS MÁS GRANDES: Base 20px (antes 13), Destacado 24px
            let fontSize = nodo.isHexNode ? 34 : (nodo.esConocido ? 20 : 16);
            if (isHovered || isSelected) fontSize += 6;

            ctx.font = "bold " + fontSize + "px sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const textY = nodo.y + nodo.radio + (10 / scaleFactor);

            // Sombra/Borde negro más grueso para máxima legibilidad
            ctx.lineWidth = 5 / scaleFactor;
            ctx.strokeStyle = 'rgba(0,0,0,0.95)';
            ctx.strokeText(nodo.nombre, nodo.x, textY);
            
            if (nodo.isHexNode) {
                ctx.fillStyle = '#ffaaaa';
            } else if (nodo.esConocido) {
                ctx.fillStyle = (isHovered || isSelected) ? ESTETICA.lineaSaliente : '#fff';
            } else {
                ctx.fillStyle = (isHovered || isSelected) ? '#ddd' : '#aaa'; 
            }
            ctx.fillText(nodo.nombre, nodo.x, textY);
        }
    });
}

export function actualizarPanelInfo() {
    const panel = document.getElementById('panel-info');
    if(!panel) return;
    
    const nodo = estadoMapa.interaccion.selectedNode || estadoMapa.interaccion.hoveredNode;

    if (!nodo) { panel.classList.add('oculto'); return; }

    document.getElementById('info-titulo').innerText = nodo.nombre;
    
    if (nodo.esConocido || nodo.isHexNode) {
        document.getElementById('info-titulo').style.color = COLOR_AFINIDAD[nodo.afinidad] || '#fff';
        document.getElementById('info-tags').innerHTML = 
            '<span class="tag" style="border-color:' + (COLOR_AFINIDAD[nodo.afinidad] || '#888') + '; color:' + (COLOR_AFINIDAD[nodo.afinidad] || '#888') + '">' + nodo.afinidad + '</span>' +
            '<span class="tag">HEX: ' + nodo.hex + '</span>' +
            '<span class="tag">C-' + nodo.clase + '</span>';
        
        document.getElementById('info-desc').innerText = nodo.resumen;
    } else {
        document.getElementById('info-titulo').style.color = '#888';
        document.getElementById('info-tags').innerHTML = '<span class="tag" style="border-color:#555; color:#888;">Requisitos Insuficientes</span>';
        document.getElementById('info-desc').innerText = 'El conocimiento de este nodo permanece sellado.';
    }
        
    const efectoEl = document.getElementById('info-efecto');
    const detallesEl = document.getElementById('info-detalles');
    
    if (nodo.esConocido) {
        if (nodo.efecto) {
            efectoEl.innerText = "Efecto: " + nodo.efecto; 
            efectoEl.style.display = 'block';
        } else {
            efectoEl.style.display = 'none';
        }

        if (nodo.overcast || nodo.undercast || nodo.especial) {
            detallesEl.style.display = 'block';
            
            const bOver = document.getElementById('box-overcast');
            const bUnder = document.getElementById('box-undercast');
            const bEsp = document.getElementById('box-especial');

            if(nodo.overcast) { bOver.style.display = 'block'; document.getElementById('info-overcast').innerText = nodo.overcast; } else { bOver.style.display = 'none'; }
            if(nodo.undercast) { bUnder.style.display = 'block'; document.getElementById('info-undercast').innerText = nodo.undercast; } else { bUnder.style.display = 'none'; }
            if(nodo.especial) { bEsp.style.display = 'block'; document.getElementById('info-especial').innerText = nodo.especial; } else { bEsp.style.display = 'none'; }
        } else {
            detallesEl.style.display = 'none';
        }
    } else { 
        efectoEl.style.display = 'none'; 
        detallesEl.style.display = 'none';
    }

    const opDiv = document.getElementById('info-op');
    if (estadoMapa.esAdmin && !nodo.isHexNode) {
        const safeId = nodo.id.replace(/'/g, "\\'");
        opDiv.innerHTML = `
            <hr style="border-color: #444; margin: 15px 0 10px 0;">
            <label style="color:var(--gold); font-size:0.85em; font-weight:bold; font-family:'Cinzel';">🛠️ ESTADO (MÁSTER):</label>
            <select onchange="window.cambiarEstadoNodo('${safeId}', this.value)" style="width:100%; background:#000; color:#fff; border:1px solid var(--gold); padding:8px; margin-top:5px; cursor:pointer; pointer-events:auto;">
                <option value="si" ${nodo.esConocido ? 'selected' : ''}>👁️ SÍ (Descubierto)</option>
                <option value="no" ${!nodo.esConocido ? 'selected' : ''}>🔒 NO (Sellado)</option>
            </select>
            <div style="font-size:0.7em; color:#888; margin-top:5px;">(Haz clic en el fondo oscuro para deseleccionar)</div>
        `;
    } else {
        opDiv.innerHTML = '';
    }

    panel.classList.remove('oculto');
}
