import { estadoMapa, COLOR_AFINIDAD } from './mapa-state.js';

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

    // 1. DIBUJAR ENLACES CON FLECHAS
    enlaces.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const angle = Math.atan2(dy, dx);
        
        const targetX = link.target.x - Math.cos(angle) * (link.target.radio + (4/camara.zoom));
        const targetY = link.target.y - Math.sin(angle) * (link.target.radio + (4/camara.zoom));

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(targetX, targetY);
        
        if (interaccion.hoveredNode === link.source || interaccion.hoveredNode === link.target) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
            ctx.lineWidth = 6 / camara.zoom; // Más gruesa al hacer hover
        } else {
            ctx.strokeStyle = link.target.arrowColor; 
            ctx.lineWidth = 2.5 / camara.zoom; // Líneas un poco más gruesas
        }
        ctx.stroke();

        // Punta de la flecha
        const headlen = 16 / camara.zoom;
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
        if (!nodo.esConocido) colorAf = '#555';
        if (nodo.isHexNode) colorAf = '#ff4444'; 
        
        const isHovered = interaccion.hoveredNode === nodo;
        
        ctx.beginPath();
        ctx.arc(nodo.x, nodo.y, nodo.radio, 0, Math.PI * 2);
        
        ctx.shadowBlur = isHovered ? 25 : (nodo.isHexNode ? 30 : 5);
        ctx.shadowColor = colorAf;

        if (nodo.isHexNode) {
            ctx.fillStyle = '#4a0000';
        } else if (nodo.esConocido) {
            ctx.fillStyle = isHovered ? '#333' : '#111';
        } else {
            ctx.fillStyle = isHovered ? '#222' : '#000'; 
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.lineWidth = (isHovered ? 4 : 2) / camara.zoom;
        ctx.strokeStyle = colorAf;
        
        if (!nodo.esConocido && !nodo.isHexNode) {
            ctx.setLineDash([5 / camara.zoom, 5 / camara.zoom]);
        }
        ctx.stroke();
        ctx.setLineDash([]); 

        // 3. TEXTOS
        if (camara.zoom > 0.25 || isHovered || nodo.isHexNode) {
            const fontSize = nodo.isHexNode ? 24 : (isHovered ? 16 : (nodo.esConocido ? 14 : 11));
            ctx.font = "bold " + fontSize + "px sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const textY = nodo.y + nodo.radio + (5 / camara.zoom);

            ctx.lineWidth = 3 / camara.zoom;
            ctx.strokeStyle = 'rgba(0,0,0,0.9)';
            ctx.strokeText(nodo.nombre, nodo.x, textY);
            
            if (nodo.isHexNode) {
                ctx.fillStyle = '#ffaaaa';
            } else if (nodo.esConocido) {
                ctx.fillStyle = isHovered ? '#00ffff' : '#fff';
            } else {
                ctx.fillStyle = isHovered ? '#aaa' : '#666'; 
            }
            ctx.fillText(nodo.nombre, nodo.x, textY);
        }
    });
}

export function actualizarPanelInfo() {
    const panel = document.getElementById('panel-info');
    if(!panel) return;
    const nodo = estadoMapa.interaccion.hoveredNode;

    if (!nodo) { panel.classList.add('oculto'); return; }

    document.getElementById('info-titulo').innerText = nodo.nombre;
    
    if (nodo.esConocido || nodo.isHexNode) {
        document.getElementById('info-titulo').style.color = COLOR_AFINIDAD[nodo.afinidad] || '#fff';
        document.getElementById('info-tags').innerHTML = 
            '<span class="tag" style="border-color:' + (COLOR_AFINIDAD[nodo.afinidad] || '#888') + '; color:' + (COLOR_AFINIDAD[nodo.afinidad] || '#888') + '">' + nodo.afinidad + '</span>' +
            '<span class="tag">HEX: ' + nodo.hex + '</span>' +
            '<span class="tag">C-' + nodo.clase + '</span>';
    } else {
        document.getElementById('info-titulo').style.color = '#888';
        document.getElementById('info-tags').innerHTML = '<span class="tag" style="border-color:#555; color:#888;">Requisitos Insuficientes</span>';
    }
        
    document.getElementById('info-desc').innerText = nodo.resumen;
    
    const efectoEl = document.getElementById('info-efecto');
    if (nodo.efecto && nodo.esConocido) {
        efectoEl.innerText = "Efecto: " + nodo.efecto; 
        efectoEl.style.display = 'block';
    } else { 
        efectoEl.style.display = 'none'; 
    }
    panel.classList.remove('oculto');
}
