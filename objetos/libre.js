import { invGlobal, objGlobal } from './obj-state.js';
import { modificar, transferir } from './obj-logic.js';
import { refrescarUI } from './obj-ui.js';

const normalizar = (str) => str.toString().trim().toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/\s+/g,'_').replace(/[^a-z0-9ñ_]/g,'');

let libreActivo = false;
let entities = []; // Players and dropped items
let draggingNode = null;
let lastMouse = { x: 0, y: 0 };
let mouseVel = { x: 0, y: 0 };
let shakeAccumulator = 0;
let animationFrameId;

export function initLibreMode() {
    const container = document.getElementById('contenedor-libre');
    if (!container) return;
    
    // Clear old physics
    container.querySelectorAll('.physics-node').forEach(e => e.remove());
    entities = [];

    // Create player nodes based on current invGlobal
    const radius = 50;
    let startX = 100;
    let startY = 100;
    
    Object.keys(invGlobal).forEach(jugador => {
        const div = document.createElement('div');
        div.className = 'physics-node player-node';
        div.style.position = 'absolute';
        div.style.width = (radius*2) + 'px';
        div.style.height = (radius*2) + 'px';
        div.style.borderRadius = '50%';
        div.style.border = '3px solid #d4af37';
        div.style.backgroundImage = `url('../img/imgpersonajes/${normalizar(jugador)}icon.png')`;
        div.style.backgroundSize = 'cover';
        div.style.boxShadow = '0 10px 20px rgba(0,0,0,0.8)';
        div.style.cursor = 'grab';
        
        // Add name tag
        const nameTag = document.createElement('div');
        nameTag.innerText = jugador;
        nameTag.style.position = 'absolute';
        nameTag.style.bottom = '-20px';
        nameTag.style.width = '100%';
        nameTag.style.textAlign = 'center';
        nameTag.style.color = '#fff';
        nameTag.style.textShadow = '1px 1px 2px #000';
        nameTag.style.pointerEvents = 'none';
        div.appendChild(nameTag);

        container.appendChild(div);

        entities.push({
            type: 'player',
            name: jugador,
            el: div,
            x: startX,
            y: startY,
            r: radius,
            vx: 0, vy: 0
        });
        
        startX += 150;
        if(startX > window.innerWidth - 100) { startX = 100; startY += 150; }
    });

    // Mouse Events for Dragging and Shaking
    container.onmousedown = (e) => {
        if(e.target.tagName === 'BUTTON') return;
        const rects = entities.filter(en => en.type === 'player').map(en => ({en, rect: en.el.getBoundingClientRect()}));
        for(let item of rects) {
            if(e.clientX >= item.rect.left && e.clientX <= item.rect.right && e.clientY >= item.rect.top && e.clientY <= item.rect.bottom) {
                draggingNode = item.en;
                draggingNode.el.style.cursor = 'grabbing';
                lastMouse = { x: e.clientX, y: e.clientY };
                shakeAccumulator = 0;
                break;
            }
        }
    };

    container.onmousemove = (e) => {
        if (!draggingNode) return;
        mouseVel.x = e.clientX - lastMouse.x;
        mouseVel.y = e.clientY - lastMouse.y;
        
        // Shake detection (rapid directional changes)
        const speed = Math.sqrt(mouseVel.x*mouseVel.x + mouseVel.y*mouseVel.y);
        if (speed > 25) { 
            shakeAccumulator += speed; 
        } else {
            shakeAccumulator = Math.max(0, shakeAccumulator - 10);
        }

        if (shakeAccumulator > 300) {
            dropRandomItem(draggingNode);
            shakeAccumulator = 0; // Reset shake
        }

        draggingNode.x = e.clientX - draggingNode.r;
        draggingNode.y = e.clientY - draggingNode.r;
        lastMouse = { x: e.clientX, y: e.clientY };
    };

    container.onmouseup = () => { if(draggingNode) draggingNode.el.style.cursor = 'grab'; draggingNode = null; };
    container.onmouseleave = () => { if(draggingNode) draggingNode.el.style.cursor = 'grab'; draggingNode = null; };

    physicsLoop();
}

function dropRandomItem(playerNode) {
    const inv = invGlobal[playerNode.name];
    if (!inv) return;
    
    // Find items that player actually has
    const availableItems = Object.keys(inv).filter(i => inv[i] > 0);
    if (availableItems.length === 0) return; // Empty inventory

    // Pick random item
    const droppedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    
    // Subtract from global inventory immediately
    modificar(playerNode.name, droppedItem, -1, refrescarUI);

    // Create physical drop
    const container = document.getElementById('contenedor-libre');
    const r = 20;
    const div = document.createElement('img');
    div.className = 'physics-node dropped-item';
    div.src = `../img/imgobjetos/${normalizar(droppedItem)}.png`;
    div.onerror = () => { div.src = '../img/imgobjetos/no_encontrado.png'; };
    div.style.position = 'absolute';
    div.style.width = (r*2) + 'px';
    div.style.height = (r*2) + 'px';
    div.style.borderRadius = '4px';
    div.style.border = '1px solid #00ffff';
    div.style.boxShadow = '0 0 10px #00ffff';
    div.style.pointerEvents = 'none';

    container.appendChild(div);

    entities.push({
        type: 'item',
        itemName: droppedItem,
        sourcePlayer: playerNode.name,
        el: div,
        x: playerNode.x + playerNode.r,
        y: playerNode.y + playerNode.r,
        r: r,
        vx: (Math.random() - 0.5) * 30, // Explosive pop out
        vy: -15 - Math.random() * 15,
        life: 0 // to prevent instant re-collection by same player
    });
}

function physicsLoop() {
    if (!libreActivo) return;
    
    const gravity = 0.8;
    const friction = 0.98;
    const h = window.innerHeight;
    const w = window.innerWidth;

    for (let i = entities.length - 1; i >= 0; i--) {
        const en = entities[i];
        
        if (en.type === 'item') {
            en.vy += gravity;
            en.vx *= friction;
            en.x += en.vx;
            en.y += en.vy;
            en.life++;

            // Floor bounce
            if (en.y + en.r*2 > h) {
                en.y = h - en.r*2;
                en.vy *= -0.6;
                en.vx *= 0.8;
            }
            // Walls bounce
            if (en.x < 0) { en.x = 0; en.vx *= -1; }
            if (en.x + en.r*2 > w) { en.x = w - en.r*2; en.vx *= -1; }

            // Collision check with players to "Collect"
            if (en.life > 30) { // 30 frames grace period so it flies away first
                for (const p of entities) {
                    if (p.type === 'player') {
                        const dx = (p.x + p.r) - (en.x + en.r);
                        const dy = (p.y + p.r) - (en.y + en.r);
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist < p.r + en.r) {
                            // Player caught it!
                            modificar(p.name, en.itemName, 1, refrescarUI);
                            showFloatText(`+1 ${en.itemName}`, p.x, p.y, '#00ff00');
                            
                            en.el.remove();
                            entities.splice(i, 1);
                            break; // Stop checking this item
                        }
                    }
                }
            }
        }

        // Apply to DOM
        if(en.el) {
            en.el.style.transform = `translate(${en.x}px, ${en.y}px)`;
        }
    }

    animationFrameId = requestAnimationFrame(physicsLoop);
}

function showFloatText(text, x, y, color) {
    const container = document.getElementById('contenedor-libre');
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
    container.appendChild(f);
    
    // Animate up and fade out
    setTimeout(() => {
        f.style.top = (y - 100) + 'px';
        f.style.opacity = '0';
    }, 50);

    setTimeout(() => f.remove(), 1000);
}

window.toggleLibre = () => {
    libreActivo = !libreActivo;
    const container = document.getElementById('contenedor-libre');
    if (libreActivo) {
        container.style.display = 'block';
        initLibreMode();
    } else {
        container.style.display = 'none';
        cancelAnimationFrame(animationFrameId);
    }
};
