import { estadoMapa, COLOR_AFINIDAD, ESTETICA } from './mapa-state.js';

let canvas, ctx;

export function inicializarCanvas() {
    canvas = document.getElementById('mapa-canvas');
    if(!canvas) return;
    ctx = canvas.getContext('2d', { alpha: false });
    redimensionar();
    window.addEventListener('resize', redimensionar);
    
    hacerPanelArrastrable();
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

    const scaleFactor = Math.max(camara.zoom, 0.2); 
    const nodoActivo = interaccion.selectedNode || interaccion.hoveredNode;

    const ancestorEdges = new Set();
    const ancestorNodes = new Set();
    const outgoingEdges = new Set();
    const outgoingNodes = new Set();

    if (nodoActivo) {
        const encontrarPrecedentes = (n) => {
            enlaces.forEach(e => {
                if (e.target === n && !ancestorEdges.has(e)) {
                    ancestorEdges.add(e);
                    ancestorNodes.add(e.source);
                    encontrarPrecedentes(e.source); 
                }
            });
        };
        encontrarPrecedentes(nodoActivo);

        enlaces.forEach(e => {
            if (e.source === nodoActivo) {
                outgoingEdges.add(e);
                outgoingNodes.add(e.target);
            }
        });
    }

    enlaces.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const angle = Math.atan2(dy, dx);
        
        const targetX = link.target.x - Math.cos(angle) * (link.target.radio + (4/scaleFactor));
        const targetY = link.target.y - Math.sin(angle) * (link.target.radio + (4/scaleFactor));

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(targetX, targetY);
        
        ctx.globalAlpha = 1.0; 

        if (nodoActivo) {
            if (outgoingEdges.has(link)) {
                ctx.strokeStyle = ESTETICA.lineaSaliente;
                ctx.lineWidth = 6 / scaleFactor;
                ctx.setLineDash([]);
            } else if (ancestorEdges.has(link)) {
                ctx.strokeStyle = ESTETICA.lineaPrecedente;
                ctx.lineWidth = 6 / scaleFactor;
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = link.target.arrowColor; 
                ctx.lineWidth = 1.5 / scaleFactor; 
                if (ctx.strokeStyle === ESTETICA.lineaRosa) ctx.setLineDash([8/scaleFactor, 8/scaleFactor]);
                else ctx.setLineDash([]);
                
                ctx.globalAlpha = 0.2; 
            }
        } else {
            ctx.strokeStyle = link.target.arrowColor; 
            ctx.lineWidth = 1.5 / scaleFactor; 
            if (ctx.strokeStyle === ESTETICA.lineaRosa) {
                ctx.setLineDash([8 / scaleFactor, 8 / scaleFactor]);
            } else {
                ctx.setLineDash([]); 
            }
        }

        ctx.stroke();
        ctx.setLineDash([]); 

        const headlen = (ctx.lineWidth * 3) + (10 / scaleFactor); 
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - headlen * Math.cos(angle - Math.PI / 7), targetY - headlen * Math.sin(angle - Math.PI / 7));
        ctx.lineTo(targetX - headlen * Math.cos(angle + Math.PI / 7), targetY - headlen * Math.sin(angle + Math.PI / 7));
        ctx.lineTo(targetX, targetY);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
    });

    nodos.forEach(nodo => {
        ctx.globalAlpha = 1.0; 
        let colorAf = COLOR_AFINIDAD[nodo.afinidad] || '#888';
        if (!nodo.esConocido) colorAf = '#777'; 
        if (nodo.isHexNode) colorAf = '#ff4444'; 
        
        const isHovered = interaccion.hoveredNode === nodo;
        const isSelected = interaccion.selectedNode === nodo;
        
        if (nodoActivo) {
            if (nodo !== nodoActivo && !ancestorNodes.has(nodo) && !outgoingNodes.has(nodo) && !nodo.isHexNode) {
                ctx.globalAlpha = 0.2;
            }
        }

        if (isSelected) {
            ctx.beginPath();
            ctx.arc(nodo.x, nodo.y, nodo.radio + (10/scaleFactor), 0, Math.PI * 2);
            ctx.strokeStyle = ESTETICA.lineaSaliente; 
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

        if (camara.zoom > 0.08 || isHovered || isSelected || nodo.isHexNode) {
            let fontSize = nodo.isHexNode ? 52 : (nodo.esConocido ? 32 : 26);
            if (isHovered || isSelected) fontSize += 8;

            ctx.font = "bold " + fontSize + "px sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const textY = nodo.y + nodo.radio + (15 / scaleFactor);

            ctx.lineWidth = 6 / scaleFactor;
            ctx.strokeStyle = 'rgba(0,0,0,0.95)'; 
            ctx.strokeText(nodo.nombre, nodo.x, textY);
            
            if (nodo.isHexNode) {
                ctx.fillStyle = '#ffaaaa';
            } else if (nodo.esConocido) {
                ctx.fillStyle = (isHovered || isSelected) ? ESTETICA.lineaSaliente : '#fff';
            } else {
                ctx.fillStyle = (isHovered || isSelected) ? '#ddd' : '#bbb'; 
            }
            ctx.fillText(nodo.nombre, nodo.x, textY);
        }
    });

    ctx.globalAlpha = 1.0; 
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
        `;
    } else {
        opDiv.innerHTML = '';
    }

    panel.classList.remove('oculto');
}

// RESETEO ABSOLUTO: Borra top/left/right y obliga a anclarse abajo
export function resetearPosicionPanel() {
    const panel = document.getElementById('panel-info');
    if (panel) {
        panel.style.removeProperty('top');
        panel.style.removeProperty('left');
        panel.style.removeProperty('right');
        
        // Forzamos las posiciones iniciales originales del CSS
        panel.style.bottom = '25px'; 
        panel.style.left = '50%'; 
        panel.style.transform = 'translateX(-50%)'; 
    }
}

// MOTOR DE ARRASTRE SÓLIDO (Evita saltos calculando coordenadas visuales reales)
function hacerPanelArrastrable() {
    const el = document.getElementById('panel-info');
    const header = document.getElementById('info-titulo');
    header.style.cursor = 'move';
    header.title = "Arrastra para mover la ventana";

    let offsetX = 0, offsetY = 0;

    header.onmousedown = iniciarArrastre;
    header.ontouchstart = iniciarArrastre;

    function iniciarArrastre(e) {
        e = e || window.event;
        if (e.type !== 'touchstart') e.preventDefault();
        
        let clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        // Si el panel aún tiene el 'transform: translateX', leemos su posición exacta en pantalla
        if (el.style.transform !== "none") {
            const rect = el.getBoundingClientRect();
            
            // Borramos el transform y lo fijamos visualmente exactamente donde estaba
            el.style.transform = "none";
            el.style.bottom = "auto";
            el.style.right = "auto";
            el.style.left = rect.left + "px";
            el.style.top = rect.top + "px";
        }

        // Calculamos la diferencia entre el click del ratón y la esquina real del panel
        const currentRect = el.getBoundingClientRect();
        offsetX = clientX - currentRect.left;
        offsetY = clientY - currentRect.top;

        document.onmouseup = detenerArrastre;
        document.onmousemove = arrastrar;
        document.ontouchend = detenerArrastre;
        document.ontouchmove = arrastrar;
    }

    function arrastrar(e) {
        e = e || window.event;
        let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        if (e.type !== 'touchmove') e.preventDefault();
        
        // Movemos el panel basándonos puramente en la posición del ratón menos el offset original
        el.style.left = (clientX - offsetX) + "px";
        el.style.top = (clientY - offsetY) + "px";
    }

    function detenerArrastre() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}
