import { estadoMapa, COLOR_AFINIDAD } from './mapa-state.js';

let canvas, ctx;

export function inicializarCanvas() {
    canvas = document.getElementById('mapa-canvas');
    ctx = canvas.getContext('2d', { alpha: false });
    redimensionar();
    window.addEventListener('resize', redimensionar);
}

function redimensionar() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    dibujarFrame();
}

export function dibujarFrame() {
    if(!ctx) return;
    const { nodos, enlaces, camara, interaccion } = estadoMapa;

    // Fondo Oscuro
    ctx.fillStyle = '#05000a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(camara.x, camara.y);
    ctx.scale(camara.zoom, camara.zoom);

    // 1. DIBUJAR ENLACES CON FLECHAS
    ctx.lineWidth = 2 / camara.zoom;
    enlaces.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const angle = Math.atan2(dy, dx);
        
        // Detener la línea en el borde del nodo, no en el centro
        const targetX = link.target.x - Math.cos(angle) * (link.target.radio + (2/camara.zoom));
        const targetY = link.target.y - Math.sin(angle) * (link.target.radio + (2/camara.zoom));

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(targetX, targetY);
        
        if (interaccion.hoveredNode === link.source || interaccion.hoveredNode === link.target) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)'; // Brillo de selección
            ctx.lineWidth = 5 / camara.zoom;
        } else {
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
            ctx.lineWidth = 1.5 / camara.zoom;
        }
        ctx.stroke();

        // Cabeza de la Flecha
        const headlen = 12 / camara.zoom;
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - headlen * Math.cos(angle - Math.PI / 6), targetY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(targetX - headlen * Math.cos(angle + Math.PI / 6), targetY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(targetX, targetY);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
    });

    // 2. DIBUJAR NODOS
    nodos.forEach(nodo => {
        const colorAf = COLOR_AFINIDAD[nodo.afinidad] || '#888';
        const isHovered = interaccion.hoveredNode === nodo;
        
        ctx.beginPath();
        ctx.arc(nodo.x, nodo.y, nodo.radio, 0, Math.PI * 2);
        
        // Estilo Cosmograph: Glow Exterior
        ctx.shadowBlur = isHovered ? 25 : 10;
        ctx.shadowColor = colorAf;

        ctx.fillStyle = nodo.esConocido ? '#111' : '#000';
        if (isHovered) ctx.fillStyle = '#333';
        ctx.fill();

        ctx.shadowBlur = 0; // Apagar glow para el borde
        ctx.lineWidth = (isHovered ? 5 : 2) / camara.zoom;
        ctx.strokeStyle = colorAf;
        
        if (!nodo.esConocido) {
            ctx.setLineDash([5 / camara.zoom, 5 / camara.zoom]);
            ctx.strokeStyle = '#555';
        }
        ctx.stroke();
        ctx.setLineDash([]); 

        // 3. ETIQUETAS (Textos con contorno oscuro para legibilidad)
        if (camara.zoom > 0.3 || isHovered || nodo.radio > 20) {
            const fontSize = isHovered ? 18 : 14;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const textY = nodo.y + nodo.radio + (5 / camara.zoom);

            // Contorno negro para que se lea en cualquier fondo
            ctx.lineWidth = 3 / camara.zoom;
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeText(nodo.nombre, nodo.x, textY);
            
            ctx.fillStyle = nodo.esConocido ? '#fff' : '#888';
            if (isHovered) ctx.fillStyle = '#00ffff'; // <--- ¡AQUÍ ESTABA EL ERROR! CORREGIDO
            ctx.fillText(nodo.nombre, nodo.x, textY);
        }
    });

    ctx.restore();
}

export function actualizarPanelInfo() {
    const panel = document.getElementById('panel-info');
    const nodo = estadoMapa.interaccion.hoveredNode;

    if (!nodo) { panel.classList.add('oculto'); return; }

    document.getElementById('info-titulo').innerText = nodo.nombre;
    document.getElementById('info-titulo').style.color = COLOR_AFINIDAD[nodo.afinidad] || '#fff';
    
    document.getElementById('info-tags').innerHTML = `
        <span class="tag" style="border-color:${COLOR_AFINIDAD[nodo.afinidad]}; color:${COLOR_AFINIDAD[nodo.afinidad]}">${nodo.afinidad}</span>
        <span class="tag">HEX: ${nodo.hex}</span>
        <span class="tag">C-${nodo.clase}</span>
    `;
    document.getElementById('info-desc').innerText = nodo.resumen;
    const efectoEl = document.getElementById('info-efecto');
    if (nodo.efecto && nodo.esConocido) {
        efectoEl.innerText = "Efecto: " + nodo.efecto; efectoEl.style.display = 'block';
    } else { efectoEl.style.display = 'none'; }
    panel.classList.remove('oculto');
}
