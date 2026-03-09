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
    const nodos = estadoMapa.nodos;
    const enlaces = estadoMapa.enlaces;
    const camara = estadoMapa.camara;
    const interaccion = estadoMapa.interaccion;

    // 1. SOLUCIÓN AL GHOSTING: Resetear la matriz para limpiar la pantalla completa correctamente
    ctx.resetTransform();
    ctx.fillStyle = '#05000a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Aplicar la cámara y la resolución de pantalla
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    ctx.translate(camara.x, camara.y);
    ctx.scale(camara.zoom, camara.zoom);

    // 3. DIBUJAR ENLACES CON FLECHAS
    ctx.lineWidth = 2 / camara.zoom;
    enlaces.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const angle = Math.atan2(dy, dx);
        
        // Detener la línea en el borde del nodo objetivo, no en su centro
        const targetX = link.target.x - Math.cos(angle) * (link.target.radio + (3/camara.zoom));
        const targetY = link.target.y - Math.sin(angle) * (link.target.radio + (3/camara.zoom));

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(targetX, targetY);
        
        if (interaccion.hoveredNode === link.source || interaccion.hoveredNode === link.target) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)'; // Línea brillante al hacer hover
            ctx.lineWidth = 4 / camara.zoom;
        } else {
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.lineWidth = 1.5 / camara.zoom;
        }
        ctx.stroke();

        // DIBUJO DE LA FLECHA
        const headlen = 12 / camara.zoom;
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - headlen * Math.cos(angle - Math.PI / 6), targetY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(targetX - headlen * Math.cos(angle + Math.PI / 6), targetY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(targetX, targetY);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
    });

    // 4. DIBUJAR NODOS
    nodos.forEach(nodo => {
        const colorAf = COLOR_AFINIDAD[nodo.afinidad] || '#888';
        const isHovered = interaccion.hoveredNode === nodo;
        
        ctx.beginPath();
        ctx.arc(nodo.x, nodo.y, nodo.radio, 0, Math.PI * 2);
        
        ctx.shadowBlur = isHovered ? 25 : 10;
        ctx.shadowColor = colorAf;

        ctx.fillStyle = nodo.esConocido ? '#111' : '#000';
        if (isHovered) ctx.fillStyle = '#333';
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.lineWidth = (isHovered ? 4 : 2) / camara.zoom;
        ctx.strokeStyle = colorAf;
        
        if (!nodo.esConocido) {
            ctx.setLineDash([5 / camara.zoom, 5 / camara.zoom]);
            ctx.strokeStyle = '#555';
        }
        ctx.stroke();
        ctx.setLineDash([]); 

        // Textos (Ocultos si la cámara está muy lejos para evitar caos visual)
        if (camara.zoom > 0.4 || isHovered || nodo.radio > 20) {
            const fontSize = isHovered ? 18 : 14;
            ctx.font = "bold " + fontSize + "px sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const textY = nodo.y + nodo.radio + (5 / camara.zoom);

            ctx.lineWidth = 3 / camara.zoom;
            ctx.strokeStyle = 'rgba(0,0,0,0.9)';
            ctx.strokeText(nodo.nombre, nodo.x, textY);
            
            ctx.fillStyle = nodo.esConocido ? '#fff' : '#888';
            if (isHovered) ctx.fillStyle = '#00ffff'; 
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
    document.getElementById('info-titulo').style.color = COLOR_AFINIDAD[nodo.afinidad] || '#fff';
    
    document.getElementById('info-tags').innerHTML = 
        '<span class="tag" style="border-color:' + (COLOR_AFINIDAD[nodo.afinidad] || '#888') + '; color:' + (COLOR_AFINIDAD[nodo.afinidad] || '#888') + '">' + nodo.afinidad + '</span>' +
        '<span class="tag">HEX: ' + nodo.hex + '</span>' +
        '<span class="tag">C-' + nodo.clase + '</span>';
        
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
