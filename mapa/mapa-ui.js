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
    const { nodos, enlaces, camara, interaccion, jugadorActivo, vistaJugador } = estadoMapa;

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
    const isPlayerView = jugadorActivo !== 'Todos';

    // Desempaquetado de memoria del jugador
    const posesiones = vistaJugador.posesiones || new Set();
    const aprendibles = vistaJugador.aprendibles || new Set();
    const rastreo = vistaJugador.rastreo || new Set();

    // Lógica para el Click Manual
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

    // ==========================================
    // 1. DIBUJAR ENLACES
    // ==========================================
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
        let drawNormal = true;

        if (nodoActivo) {
            if (outgoingEdges.has(link)) {
                ctx.strokeStyle = ESTETICA.lineaSaliente;
                ctx.lineWidth = 6 / scaleFactor;
                ctx.setLineDash([]);
                drawNormal = false;
            } else if (ancestorEdges.has(link)) {
                ctx.strokeStyle = ESTETICA.lineaPrecedente;
                ctx.lineWidth = 6 / scaleFactor;
                ctx.setLineDash([]);
                drawNormal = false;
            } else {
                // Al pasar el mouse, apagamos el resto (sin importar el modo jugador)
                ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)'; 
                ctx.lineWidth = 1 / scaleFactor; 
                ctx.setLineDash([]);
                ctx.globalAlpha = 0.2; 
                drawNormal = false;
            }
        } 
        
        if (drawNormal) {
            if (isPlayerView) {
                let sP = posesiones.has(link.source);
                let tP = posesiones.has(link.target);
                let tA = aprendibles.has(link.target);
                let sT = rastreo.has(link.source) || sP;
                let tT = rastreo.has(link.target) || tP || tA;

                if (sP && tP) {
                    // Tienes ambos: Morado Activo
                    ctx.strokeStyle = 'rgba(138, 43, 226, 0.7)'; 
                    ctx.lineWidth = 3 / scaleFactor;
                    ctx.setLineDash([]);
                } else if (sP && tA) {
                    // Tienes el origen, el objetivo es aprendible: Lógica de Progreso
                    let target = link.target;
                    let totalReq = target.incomingSources.length;
                    let posReq = target.incomingSources.filter(n => posesiones.has(n)).length;
                    let ratio = posReq / totalReq;

                    // Verde -> VerdeAmarillo -> Amarillo
                    if (ratio >= 0.75) ctx.strokeStyle = 'rgba(50, 205, 50, 0.7)'; 
                    else if (ratio >= 0.4) ctx.strokeStyle = 'rgba(173, 255, 47, 0.7)'; 
                    else ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; 
                    
                    ctx.lineWidth = 4 / scaleFactor;
                    ctx.setLineDash([]);
                } else if (sT && tT) {
                    // Es parte del árbol genealógico pero no lo tienes
                    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'; 
                    ctx.lineWidth = 1.5 / scaleFactor;
                    ctx.setLineDash([8 / scaleFactor, 8 / scaleFactor]);
                } else {
                    // No te interesa: Súper apagado
                    ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
                    ctx.lineWidth = 1 / scaleFactor;
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 0.05;
                }
            } else {
                // MODO TODOS
                ctx.strokeStyle = link.target.arrowColor; 
                ctx.lineWidth = 1.5 / scaleFactor; 
                if (ctx.strokeStyle === ESTETICA.lineaRosa) ctx.setLineDash([8 / scaleFactor, 8 / scaleFactor]);
                else ctx.setLineDash([]); 
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

    // ==========================================
    // 2. DIBUJAR NODOS
    // ==========================================
    nodos.forEach(nodo => {
        ctx.globalAlpha = 1.0; 
        
        let colorAf = COLOR_AFINIDAD[nodo.afinidad] || '#888';
        if (nodo.isHexNode) colorAf = '#ff4444'; 

        // Si estamos en MODO JUGADOR, el color del borde y el resplandor cambia a Morado/Amarillo
        if (isPlayerView && !nodo.isHexNode) {
            if (posesiones.has(nodo)) colorAf = 'rgba(138, 43, 226, 1)'; 
            else if (aprendibles.has(nodo) || rastreo.has(nodo)) colorAf = 'rgba(212, 175, 55, 1)'; 
            else colorAf = '#444'; 
        }
        
        const isHovered = interaccion.hoveredNode === nodo;
        const isSelected = interaccion.selectedNode === nodo;
        
        // Manejo estricto de opacidades
        if (nodoActivo) {
            if (nodo !== nodoActivo && !ancestorNodes.has(nodo) && !outgoingNodes.has(nodo) && !nodo.isHexNode) {
                ctx.globalAlpha = 0.2;
            }
        } else if (isPlayerView) {
            if (!posesiones.has(nodo) && !aprendibles.has(nodo) && !rastreo.has(nodo) && !nodo.isHexNode) {
                ctx.globalAlpha = 0.05; // Borrado casi total de lo inútil
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

        if (isPlayerView) {
            if (posesiones.has(nodo)) {
                ctx.fillStyle = 'rgba(138, 43, 226, 0.9)'; // Morado relleno
                ctx.fill();
            } else if (aprendibles.has(nodo) || rastreo.has(nodo)) {
                ctx.fillStyle = 'rgba(212, 175, 55, 0.8)'; // Amarillo relleno
                ctx.fill();
            } else {
                ctx.fillStyle = '#222'; // Oculto relleno
                ctx.fill();
            }
        } else {
            // Lógica MODO TODOS
            if (nodo.isHexNode) {
                ctx.fillStyle = '#4a0000';
                ctx.fill();
            } else if (nodo.esConocido) {
                ctx.fillStyle = (isHovered || isSelected) ? '#333' : '#111';
                ctx.fill();
            } else {
                ctx.fillStyle = (isHovered || isSelected) ? '#444' : '#222'; 
                ctx.fill();
                
                const currentAlpha = ctx.globalAlpha;
                ctx.globalAlpha = currentAlpha * 0.15; 
                ctx.fillStyle = colorAf; 
                ctx.fill();
                ctx.globalAlpha = currentAlpha; 
            }
        }
        
        ctx.shadowBlur = 0;
        ctx.lineWidth = ((isHovered || isSelected) ? 4 : 2) / scaleFactor;
        
        if (!isPlayerView && !nodo.esConocido && !nodo.isHexNode) {
            const currentAlpha = ctx.globalAlpha;
            ctx.globalAlpha = currentAlpha * 0.5;
            ctx.strokeStyle = colorAf;
            ctx.setLineDash([6 / scaleFactor, 4 / scaleFactor]);
            ctx.stroke();
            ctx.globalAlpha = currentAlpha; 
        } else {
            ctx.strokeStyle = colorAf;
            ctx.setLineDash([]);
            ctx.stroke();
        }
        ctx.setLineDash([]); 

        // ==========================================
        // 3. TEXTOS
        // ==========================================
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
            } else if (isPlayerView && !posesiones.has(nodo) && !aprendibles.has(nodo) && !rastreo.has(nodo)) {
                ctx.fillStyle = '#444'; // Texto muy apagado si no es parte del jugador
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
    const colorAfinidad = COLOR_AFINIDAD[nodo.afinidad] || '#888';
    
    if (nodo.esConocido || nodo.isHexNode) {
        document.getElementById('info-titulo').style.color = colorAfinidad;
        document.getElementById('info-tags').innerHTML = 
            '<span class="tag" style="border-color:' + colorAfinidad + '; color:' + colorAfinidad + '">' + nodo.afinidad + '</span>' +
            '<span class="tag">HEX: ' + nodo.hex + '</span>' +
            '<span class="tag">C-' + nodo.clase + '</span>';
        
        document.getElementById('info-desc').innerText = nodo.resumen;
    } else {
        document.getElementById('info-titulo').style.color = colorAfinidad;
        document.getElementById('info-tags').innerHTML = 
            '<span class="tag" style="border-color:' + colorAfinidad + '; color:' + colorAfinidad + '">' + nodo.afinidad + '</span>' +
            '<span class="tag" style="border-color:#555; color:#888;">Requisitos Insuficientes</span>';
        
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

export function resetearPosicionPanel() {
    const panel = document.getElementById('panel-info');
    if (panel) {
        panel.style.top = '';
        panel.style.left = '';
        panel.style.right = '';
        panel.style.bottom = '';
        panel.style.transform = '';
    }
}

function hacerPanelArrastrable() {
    const el = document.getElementById('panel-info');
    el.style.cursor = 'grab';
    el.title = "Arrastra para mover la ventana";

    const header = document.getElementById('info-titulo');
    if (header) {
        header.style.cursor = 'default';
        header.title = '';
    }

    let offsetX = 0, offsetY = 0;

    el.onmousedown = iniciarArrastre;
    el.ontouchstart = iniciarArrastre;

    function iniciarArrastre(e) {
        if (e.target.closest('button') || e.target.closest('select') || e.target.closest('summary')) {
            return; 
        }

        e = e || window.event;
        if (e.type !== 'touchstart') e.preventDefault(); 
        
        el.style.cursor = 'grabbing'; 
        
        let clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        const rect = el.getBoundingClientRect();
        
        el.style.bottom = "auto";
        el.style.right = "auto";
        el.style.transform = "none";
        
        el.style.left = rect.left + "px";
        el.style.top = rect.top + "px";

        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;

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
        
        el.style.left = (clientX - offsetX) + "px";
        el.style.top = (clientY - offsetY) + "px";
    }

    function detenerArrastre() {
        el.style.cursor = 'grab'; 
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}
