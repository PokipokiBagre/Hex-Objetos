import { invGlobal, objGlobal } from './obj-state.js';
import { modificar } from './obj-logic.js';
import { refrescarUI } from './obj-ui.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/\s+/g,'_').replace(/[^a-z0-9ñ_]/g,'');

let libreActivo = false;
let entities = []; 
let draggingNode = null;
let lastMouse = { x: 0, y: 0 };
let shakeAccumulator = 0;
let lastDropTime = 0;
let animationFrameId;

// Creación de las 3 Repisas de Media Luna
const shelves = [
    { x: window.innerWidth * 0.1, y: window.innerHeight * 0.4, w: window.innerWidth * 0.25, h: 40 },
    { x: window.innerWidth * 0.65, y: window.innerHeight * 0.6, w: window.innerWidth * 0.25, h: 40 },
    { x: window.innerWidth * 0.35, y: window.innerHeight * 0.8, w: window.innerWidth * 0.3, h: 40 }
];

export function initLibreMode() {
    const container = document.getElementById('contenedor-libre');
    if (!container) return;
    
    container.querySelectorAll('.physics-node').forEach(e => e.remove());
    entities = [];

    // Dibujar las repisas en el DOM
    shelves.forEach(s => {
        const div = document.createElement('div');
        div.className = 'shelf physics-node';
        div.style.left = s.x + 'px';
        div.style.top = s.y + 'px';
        div.style.width = s.w + 'px';
        div.style.height = s.h + 'px';
        container.appendChild(div);
    });

    // Crear a los jugadores con física
    const radius = 50;
    let startX = window.innerWidth / 2 - radius;
    let startY = 100;
    
    Object.keys(invGlobal).forEach(jugador => {
        const div = document.createElement('div');
        div.className = 'physics-node';
        div.style.position = 'absolute';
        div.style.width = (radius*2) + 'px';
        div.style.height = (radius*2) + 'px';
        div.style.borderRadius = '50%';
        div.style.border = '3px solid var(--gold)';
        div.style.backgroundImage = `url('../img/imgpersonajes/${normalizar(jugador)}icon.png')`;
        div.style.backgroundSize = 'cover';
        div.style.boxShadow = '0 10px 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(212,175,55,0.5)';
        div.style.cursor = 'grab';
        
        const nameTag = document.createElement('div');
        nameTag.innerText = jugador.toUpperCase();
        nameTag.style.position = 'absolute';
        nameTag.style.bottom = '-25px';
        nameTag.style.width = '100%';
        nameTag.style.textAlign = 'center';
        nameTag.style.color = 'var(--gold)';
        nameTag.style.fontWeight = 'bold';
        nameTag.style.textShadow = '2px 2px 4px #000';
        nameTag.style.pointerEvents = 'none';
        div.appendChild(nameTag);

        container.appendChild(div);

        entities.push({
            type: 'player', name: jugador, el: div,
            x: startX + (Math.random()*100 - 50), y: startY, r: radius,
            vx: (Math.random()-0.5)*10, vy: 0, isDragging: false
        });
    });

    // Control del ratón
    container.onmousedown = (e) => {
        if(e.target.tagName === 'BUTTON') return;
        for(let en of entities) {
            if(en.type !== 'player') continue;
            const dx = e.clientX - (en.x + en.r);
            const dy = e.clientY - (en.y + en.r);
            if(Math.sqrt(dx*dx + dy*dy) <= en.r) {
                draggingNode = en;
                draggingNode.isDragging = true;
                draggingNode.el.style.cursor = 'grabbing';
                lastMouse = { x: e.clientX, y: e.clientY };
                shakeAccumulator = 0;
                break;
            }
        }
    };

    container.onmousemove = (e) => {
        if (!draggingNode) return;
        
        let dx = e.clientX - lastMouse.x;
        let dy = e.clientY - lastMouse.y;
        
        // Impartir momento a la burbuja
        draggingNode.vx = dx * 0.4;
        draggingNode.vy = dy * 0.4;
        
        // Sistema de agitación (Shake to drop)
        let speed = Math.sqrt(dx*dx + dy*dy);
        if (speed > 25) shakeAccumulator += speed;
        else shakeAccumulator = Math.max(0, shakeAccumulator - 10);

        let now = Date.now();
        if (shakeAccumulator > 300 && now - lastDropTime > 250) {
            dropRandomItem(draggingNode);
            shakeAccumulator = 0;
            lastDropTime = now;
        }

        draggingNode.x = e.clientX - draggingNode.r;
        draggingNode.y = e.clientY - draggingNode.r;
        lastMouse = { x: e.clientX, y: e.clientY };
    };

    container.onmouseup = () => { if(draggingNode) { draggingNode.isDragging = false; draggingNode.el.style.cursor = 'grab'; draggingNode = null; } };
    container.onmouseleave = () => { if(draggingNode) { draggingNode.isDragging = false; draggingNode.el.style.cursor = 'grab'; draggingNode = null; } };

    physicsLoop();
}

function dropRandomItem(playerNode) {
    const inv = invGlobal[playerNode.name];
    if (!inv) return;
    const availableItems = Object.keys(inv).filter(i => inv[i] > 0);
    if (availableItems.length === 0) return; 
    
    const droppedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    modificar(playerNode.name, droppedItem, -1, refrescarUI);

    const r = 25; 
    const div = document.createElement('img');
    div.className = 'physics-node';
    div.src = `../img/imgobjetos/${normalizar(droppedItem)}.png`;
    div.onerror = () => { div.src = '../img/imgobjetos/no_encontrado.png'; };
    div.style.position = 'absolute';
    div.style.width = (r*2) + 'px';
    div.style.height = (r*2) + 'px';
    div.style.borderRadius = '6px';
    div.style.border = '2px solid #00ffff';
    div.style.boxShadow = '0 0 15px #00ffff';
    div.style.pointerEvents = 'none';

    document.getElementById('contenedor-libre').appendChild(div);

    entities.push({
        type: 'item', itemName: droppedItem, el: div,
        x: playerNode.x + playerNode.r - r, // Nace EXACTAMENTE en el centro
        y: playerNode.y + playerNode.r - r,
        r: r,
        vx: (Math.random() - 0.5) * 30, // Explosión a los lados
        vy: -15 - Math.random() * 15, // Salto hacia arriba
        life: 0 
    });
}

function physicsLoop() {
    if (!libreActivo) return;
    
    const gravity = 0.5;
    const frictionX = 0.96;
    const bounce = 0.5;
    const h = window.innerHeight;
    const w = window.innerWidth;

    for (let i = entities.length - 1; i >= 0; i--) {
        const en = entities[i];
        
        if (!en.isDragging) {
            en.vy += gravity;
            en.vx *= frictionX;
            en.x += en.vx;
            en.y += en.vy;

            // Piso (para evitar que se queden temblando se pone vy en 0 si es poca)
            if (en.y + en.r*2 >= h) {
                en.y = h - en.r*2;
                en.vy *= -bounce;
                if (Math.abs(en.vy) < 1.5) en.vy = 0;
                en.vx *= 0.8;
            }
            
            // Paredes
            if (en.x <= 0) { en.x = 0; en.vx *= -bounce; }
            if (en.x + en.r*2 >= w) { en.x = w - en.r*2; en.vx *= -bounce; }

            // Repisas (Media lunas)
            for (let s of shelves) {
                if (en.x + en.r > s.x && en.x + en.r < s.x + s.w) { // Si el centro X del objeto está sobre la repisa
                    if (en.vy >= 0 && en.y + en.r*2 >= s.y && en.y + en.r*2 - en.vy <= s.y + 15) { // Si estaba arriba y cayó encima
                        en.y = s.y - en.r*2;
                        en.vy *= -bounce;
                        if (Math.abs(en.vy) < 1.5) en.vy = 0;
                        en.vx *= 0.8;
                    }
                }
            }
        }

        // Recolección
        if (en.type === 'item') {
            en.life++;
            if (en.life > 40) { // Solo se puede recoger tras ~0.6 segundos de salir volando
                for (const p of entities) {
                    if (p.type === 'player') {
                        const dx = (p.x + p.r) - (en.x + en.r);
                        const dy = (p.y + p.r) - (en.y + en.r);
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist < p.r + en.r + 15) { // Si están cerca
                            modificar(p.name, en.itemName, 1, refrescarUI);
                            showFloatText(`+1 ${en.itemName}`, p.x, p.y, '#00ff00');
                            en.el.remove();
                            entities.splice(i, 1);
                            break; 
                        }
                    }
                }
            }
        }

        if(en.el && entities.includes(en)) {
            en.el.style.transform = `translate(${en.x}px, ${en.y}px)`;
        }
    }
    animationFrameId = requestAnimationFrame(physicsLoop);
}

function showFloatText(text, x, y, color) {
    const f = document.createElement('div');
    f.innerText = text;
    f.style.position = 'absolute';
    f.style.left = x + 'px';
    f.style.top = y + 'px';
    f.style.color = color;
    f.style.fontWeight = 'bold';
    f.style.fontSize = '1.5em';
    f.style.textShadow = '2px 2px 0 #000';
    f.style.pointerEvents = 'none';
    f.style.transition = 'all 1s ease-out';
    f.style.zIndex = 9999;
    document.getElementById('contenedor-libre').appendChild(f);
    
    setTimeout(() => { f.style.top = (y - 100) + 'px'; f.style.opacity = '0'; }, 50);
    setTimeout(() => f.remove(), 1000);
}

export function toggleLibre() {
    libreActivo = !libreActivo;
    const container = document.getElementById('contenedor-libre');
    if (libreActivo) {
        container.style.display = 'block';
        initLibreMode();
    } else {
        container.style.display = 'none';
        cancelAnimationFrame(animationFrameId);
    }
}
