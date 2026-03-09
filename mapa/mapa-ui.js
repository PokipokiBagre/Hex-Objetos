import { estadoMapa, COLOR_AFINIDAD } from './mapa-state.js';

let canvas, ctx;

export function inicializarCanvas() {
    canvas = document.getElementById('mapa-canvas');
    ctx = canvas.getContext('2d', { alpha: false }); // Optimización
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

    // Limpiar fondo
    ctx.fillStyle = '#05000a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(camara.x, camara.y);
    ctx.scale(camara.zoom, camara.zoom);

    // 1. Dibujar Enlaces (Líneas)
    ctx.lineWidth = 2 / camara.zoom;
    enlaces.forEach(link => {
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        
        // Si uno de los nodos está hovered, resaltar la línea
        if (interaccion.hoveredNode === link.source || interaccion.hoveredNode === link.target) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 4 / camara.zoom;
        } else {
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.lineWidth = 2 / camara.zoom;
        }
        ctx.stroke();
    });

    // 2. Dibujar Nodos
    nodos.forEach(nodo => {
        const colorAf = COLOR_AFINIDAD[nodo.afinidad] || '#888';
        const isHovered = interaccion.hoveredNode === nodo;
        
        ctx.beginPath();
        ctx.arc(nodo.x, nodo.y, nodo.radio, 0, Math.PI * 2);
        
        // Relleno
        ctx.fillStyle = nodo.esConocido ? '#111' : '#000';
        if (isHovered) ctx.fillStyle = '#222';
        ctx.fill();

        // Borde
        ctx.lineWidth = (isHovered ? 4 : 2) / camara.zoom;
        ctx.strokeStyle = colorAf;
        if (!nodo.esConocido) {
            ctx.setLineDash([5 / camara.zoom, 5 / camara.zoom]); // Nodo oculto = punteado
            ctx.strokeStyle = '#555';
        }
        ctx.stroke();
        ctx.setLineDash([]); // Resetear punteado

        // Etiqueta de texto (Solo si el zoom es aceptable o si es hover)
        if (camara.zoom > 0.4 || isHovered) {
            const fontSize = isHovered ? 16 : 12;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillStyle = nodo.esConocido ? '#fff' : '#666';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(nodo.nombre, nodo.x, nodo.y + nodo.radio + (5 / camara.zoom));
        }
    });

    ctx.restore();
}

export function actualizarPanelInfo() {
    const panel = document.getElementById('panel-info');
    const nodo = estadoMapa.interaccion.hoveredNode;

    if (!nodo) {
        panel.classList.add('oculto');
        return;
    }

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
        efectoEl.innerText = "Efecto: " + nodo.efecto;
        efectoEl.style.display = 'block';
    } else {
        efectoEl.style.display = 'none';
    }

    panel.classList.remove('oculto');
}
