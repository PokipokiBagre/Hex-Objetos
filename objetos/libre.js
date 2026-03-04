import { invGlobal } from './obj-state.js';
import { modificar } from './obj-logic.js';
import { refrescarUI } from './obj-ui.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/\s+/g,'_').replace(/[^a-z0-9ñ_]/g,'');

let libreActivo = false;
let entities = []; 
let draggingNode = null;
let shakeAccumulator = 0;
let lastDropTime = 0;
let animationFrameId;

// Tamaño del "Lienzo" virtual
const CANVAS_W = 1000;
const CANVAS_H = 700;

// Repisas en forma de Media Luna
const shelves = [
    { x: 100, y: 250, w: 200, h: 20 },
    { x: 650, y: 350, w: 250, h: 20 },
    { x: 300, y: 550, w: 350, h: 20 }
];

export function initLibreMode() {
    const canvas = document.getElementById('contenedor-libre');
    if (!canvas) return;
    
    canvas.querySelectorAll('.physics-node').forEach(e => e.remove());
    entities = [];

    // Pintar las repisas
    shelves.forEach(s => {
        const div = document.createElement('div');
        div.className = 'shelf physics-node';
        div.style.left = s.x + 'px';
        div.style.top = s.y + 'px';
        div.style.width = s.w + 'px';
        div.style.height = s.h + 'px';
        canvas.appendChild(div);
    });

    const radius = 45;
    let shelfIndex = 0;
    
    // Posicionar jugadores repartidos en las repisas
    Object.keys(invGlobal).forEach(jugador => {
        const s = shelves[shelfIndex % shelves.length];
        let px = s.x + (Math.random() * (s.w - 2 * radius));
        let py = s.y - (radius * 2) - 30; // Nacen un poco arriba de la repisa
        shelfIndex++;

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

        canvas.appendChild(div);

        entities.push({
            type: 'player', name: jugador, el: div,
            x: px, y: py, r: radius, mass: 5,
            vx: 0, vy: 0, isDragging: false
        });
    });

    // Control de ratón adaptado al Canvas
    canvas.onmousedown = (e) => {
        if(e.target.tagName === 'BUTTON') return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        for(let en of entities) {
            if(en.type !== 'player') continue;
            const dx = mx - (en.x + en.r);
            const dy = my - (en.y + en.r);
            if(Math.sqrt(dx*dx + dy*dy) <= en.r) {
                draggingNode = en;
                draggingNode.isDragging = true;
                draggingNode.el.style.cursor = 'grabbing';
                shakeAccumulator = 0;
                break;
            }
        }
    };

    canvas.onmousemove = (e) => {
        if (!draggingNode) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        let targetX = mx - draggingNode.r;
        let targetY = my - draggingNode.r;

        // Calcular velocidad para cuando lo sueltes
        draggingNode.vx = (targetX - draggingNode.x) * 0.7;
        draggingNode.vy = (targetY - draggingNode.y) * 0.7;

        // Agitación (Shake)
        let speed = Math.sqrt(draggingNode.vx**2 + draggingNode.vy**2);
        if (speed > 20) shakeAccumulator += speed;
        else shakeAccumulator = Math.max(0, shakeAccumulator - 5);

        if (shakeAccumulator > 300 && (Date.now() - lastDropTime > 200)) {
            dropRandomItem(draggingNode);
            shakeAccumulator = 0;
            lastDropTime = Date.now();
        }

        draggingNode.x = targetX;
        draggingNode.y = targetY;
    };

    canvas.onmouseup = () => { if(draggingNode) { draggingNode.isDragging = false; draggingNode.el.style.cursor = 'grab'; draggingNode = null; } };
    canvas.onmouseleave = () => { if(draggingNode) { draggingNode.isDragging = false; draggingNode.el.style.cursor = 'grab'; draggingNode = null; } };

    physicsLoop();
}

function dropRandomItem(playerNode) {
    const inv = invGlobal[playerNode.name];
    if (!inv) return;
    const availableItems = Object.keys(inv).filter(i => inv[i] > 0);
    if (availableItems.length === 0) return; 
    
    const droppedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    modificar(playerNode.name, droppedItem, -1, refrescarUI);

    const r = 18; 
    const div = document.createElement('img');
    div.className = 'physics-node';
    div.src = `../img/imgobjetos/${normalizar(droppedItem)}.png`;
    div.onerror = () => { div.src = '../img/imgobjetos/no_encontrado.png'; };
    div.style.position = 'absolute';
    div.style.width = (r*2) + 'px';
    div.style.height = (r*2) + 'px';
    div.style.borderRadius = '4px';
    div.style.border = '2px solid #00ffff';
    div.style.boxShadow = '0 0 15px #00ffff';
    div.style.pointerEvents = 'none';

    document.getElementById('contenedor-libre').appendChild(div);

    entities.push({
        type: 'item', itemName: droppedItem, el: div,
        x: playerNode.x + playerNode.r - r, 
        y: playerNode.y + playerNode.r - r,
        r: r, mass: 1,
        vx: (Math.random() - 0.5) * 30, // Sale disparado
        vy: -15 - Math.random() * 10,
        life: 0 
    });
}

function physicsLoop() {
    if (!libreActivo) return;
    
    const gravity = 0.6;
    const bounce = 0.5;

    for (let i = entities.length - 1; i >= 0; i--) {
        let en = entities[i];
        
        if (!en.isDragging) {
            en.vy += gravity;
            en.vy *= 0.99; 
            en.vx *= 0.98;
            en.x += en.vx;
            en.y += en.vy;

            // Suelo y Techo
            if (en.y + en.r*2 > CANVAS_H) { en.y = CANVAS_H - en.r*2; en.vy *= -bounce; en.vx *= 0.8; }
            if (en.y < 0) { en.y = 0; en.vy *= -bounce; }
            
            // Paredes
            if (en.x < 0) { en.x = 0; en.vx *= -bounce; }
            if (en.x + en.r*2 > CANVAS_W) { en.x = CANVAS_W - en.r*2; en.vx *= -bounce; }

            // Repisas
            for (let s of shelves) {
                if (en.x + en.r > s.x && en.x + en.r < s.x + s.w) { 
                    // Cae desde arriba
                    if (en.vy > 0 && en.y + en.r*2 >= s.y && en.y + en.r*2 - en.vy <= s.y + 15) {
                        en.y = s.y - en.r*2;
                        en.vy *= -bounce;
                        en.vx *= 0.8;
                    }
                }
            }
        }
    }

    // Colisiones entre Entidades (Jugadores y Objetos)
    for (let i=0; i<entities.length; i++) {
        for (let j=i+1; j<entities.length; j++) {
            let a = entities[i];
            let b = entities[j];
            let dx = (b.x + b.r) - (a.x + a.r);
            let dy = (b.y + b.r) - (a.y + a.r);
            let dist = Math.sqrt(dx*dx + dy*dy);
            let min_dist = a.r + b.r;

            if (dist < min_dist && dist > 0) {
                // Recoger Objeto
                if (a.type === 'player' && b.type === 'item' && b.life > 30) {
                    modificar(a.name, b.itemName, 1, refrescarUI);
                    showFloatText(`+1 ${b.itemName}`, a.x, a.y, '#00ff00');
                    b.el.remove();
                    entities.splice(j, 1);
                    break;
                }
                if (b.type === 'player' && a.type === 'item' && a.life > 30) {
                    modificar(b.name, a.itemName, 1, refrescarUI);
                    showFloatText(`+1 ${a.itemName}`, b.x, b.y, '#00ff00');
                    a.el.remove();
                    entities.splice(i, 1);
                    break;
                }

                // Choque Físico
                let angle = Math.atan2(dy, dx);
                let overlap = min_dist - dist;
                let tx = Math.cos(angle) * overlap / 2;
                let ty = Math.sin(angle) * overlap / 2;

                if (!a.isDragging) { a.x -= tx; a.y -= ty; }
                if (!b.isDragging) { b.x += tx; b.y += ty; }

                let nx = dx / dist;
                let ny = dy / dist;
                let kx = (a.vx - b.vx);
                let ky = (a.vy - b.vy);
                let p = 2 * (nx * kx + ny * ky) / (a.mass + b.mass);
                
                if (!a.isDragging) { a.vx -= p * b.mass * nx * 0.5; a.vy -= p * b.mass * ny * 0.5; }
                if (!b.isDragging) { b.vx += p * a.mass * nx * 0.5; b.vy += p * a.mass * ny * 0.5; }
            }
        }
    }

    // Dibujar en pantalla
    for (let en of entities) {
        if (en.type === 'item') en.life++;
        if (en.el) en.el.style.transform = `translate(${en.x}px, ${en.y}px)`;
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
    const bg = document.getElementById('modal-libre-bg');
    if (libreActivo) {
        bg.style.display = 'flex';
        initLibreMode();
    } else {
        bg.style.display = 'none';
        cancelAnimationFrame(animationFrameId);
    }
}
