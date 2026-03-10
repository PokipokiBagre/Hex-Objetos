import { estadoMapa, ESTETICA } from './mapa-state.js';

export const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycby1jLgF-2bGWv0QW0Eg8u7msZ-ab2eQa--olIWQHsin8Kyz0y0xHevK7YyGyMyzq1BWKw/exec';

export async function cargarDatos(barra) {
    try {
        if(barra) barra.style.width = '30%';
        const res = await fetch(API_HECHIZOS);
        if(barra) barra.style.width = '70%';

        const jsonText = await res.text();
        const json = JSON.parse(decodeURIComponent(escape(window.atob(jsonText))));
        
        procesarNodos(json);
        procesarEnlaces(json.String || json.string || json.Strings || []);
        
        if(barra) barra.style.width = '100%';
        return true;
    } catch(e) {
        console.error("Error cargando mapa:", e);
        return false;
    }
}

function parseGephiCoord(val) {
    if (val === undefined || val === null || val === '') return null;
    let str = String(val).trim().replace(/,/g, '.').replace(/[^0-9\.\-]/g, '');
    let num = parseFloat(str);
    return isNaN(num) ? null : num;
}

function procesarNodos(json) {
    const todos = [].concat(json.nodos || []).concat(json.nodosOcultos || []);
    estadoMapa.nodos = [];
    const nodosProcesados = new Set();
    
    let hexNodeRaw = null;

    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;
        const keyX = Object.keys(n).find(k => k.trim().toLowerCase() === 'x');
        const keyY = Object.keys(n).find(k => k.trim().toLowerCase() === 'y');
        
        n._rawX = keyX ? parseGephiCoord(n[keyX]) : null;
        n._rawY = keyY ? parseGephiCoord(n[keyY]) : null;

        if (n._rawX === null) n._rawX = Math.random() * 500;
        if (n._rawY === null) n._rawY = Math.random() * 500;

        const idStr = String(n.ID || '').trim().toLowerCase();
        const nomStr = String(n.Nombre || '').trim().toLowerCase();
        if (idStr === 'hex' || nomStr === 'hex' || idStr === 'hechizo hex') {
            hexNodeRaw = n; 
        }
    });

    let originX = hexNodeRaw ? hexNodeRaw._rawX : 0;
    let originY = hexNodeRaw ? hexNodeRaw._rawY : 0;

    let maxXDist = 1; let maxYDist = 1;
    todos.forEach(n => {
        let dx = Math.abs(n._rawX - originX);
        let dy = Math.abs(n._rawY - originY);
        if (dx > maxXDist) maxXDist = dx;
        if (dy > maxYDist) maxYDist = dy;
    });

    estadoMapa.math.originX = originX;
    estadoMapa.math.originY = originY;
    estadoMapa.math.maxXDist = maxXDist;
    estadoMapa.math.maxYDist = maxYDist;

    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;

        const idReal = n.ID ? n.ID.toString().trim() : '';
        const nombreReal = n.Nombre && n.Nombre.trim() !== "" ? n.Nombre.trim() : idReal;

        const idUnico = (idReal || nombreReal).toLowerCase();
        if (nodosProcesados.has(idUnico)) return;
        nodosProcesados.add(idUnico);

        const esConocido = n.Conocido && n.Conocido.toString().trim().toLowerCase() === 'si';
        const hexCost = parseInt(n.HEX) || 0;
        const isHexNode = (idUnico === 'hex' || idUnico === 'hechizo hex');

        let baseName = nombreReal.replace(/\s*\(\d+\)$/, '').trim(); 
        
        let nombreMostrar = "";
        if (esConocido || isHexNode) {
            nombreMostrar = isHexNode ? "HEX" : `${baseName} (${hexCost})`;
        } else {
            let maskName = idReal.toLowerCase().includes('hechizo') ? idReal : `Hechizo ${idReal}`;
            nombreMostrar = `${maskName} (${hexCost})`;
        }

        const radioExpansion = 2500;
        const x = ((n._rawX - originX) / maxXDist) * radioExpansion;
        const y = -((n._rawY - originY) / maxYDist) * radioExpansion; 

        let radio = esConocido ? 35 : 28;
        if (isHexNode) radio = 65;

        const extData = (key) => {
            const foundKey = Object.keys(n).find(k => k.trim().toLowerCase().includes(key));
            return foundKey ? n[foundKey] : '';
        };

        estadoMapa.nodos.push({
            id: idReal,
            nombreOriginal: nombreReal,
            nombre: nombreMostrar,
            afinidad: n.Afinidad || 'Desconocida', 
            clase: n.Clase || '-',
            hex: hexCost,
            resumen: n.Resumen || 'Sin descripción',
            efecto: n.Efecto || '',
            overcast: extData('overcast'), 
            undercast: extData('undercast'), 
            especial: extData('especial'),
            esConocido: esConocido,
            isHexNode: isHexNode,
            x: x,
            y: y,
            _rawX: n._rawX, 
            _rawY: n._rawY,
            radio: radio,
            incomingSources: [],
            modificado: false
        });
    });
}

function procesarEnlaces(arrayStrings) {
    estadoMapa.enlaces = [];
    
    const findNode = (val) => {
        if (!val) return null;
        const str = String(val).trim().toLowerCase();
        const strNum = str.replace(/^hechizo\s+/i, '').trim();

        return estadoMapa.nodos.find(n => {
            const nid = String(n.id).trim().toLowerCase();
            const nnom = String(n.nombreOriginal).trim().toLowerCase();
            const nidNum = nid.replace(/^hechizo\s+/i, '').trim();
            const nnomNum = nnom.replace(/^hechizo\s+/i, '').trim();
            return nid === str || nnom === str || nidNum === strNum || nnomNum === strNum;
        });
    };

    arrayStrings.forEach(rel => {
        if (!rel) return;
        const vals = Object.values(rel).map(v => String(v).trim());
        if (vals.length < 2) return;

        const sourceNode = findNode(vals[0]);
        const targetNode = findNode(vals[1]);

        if (sourceNode && targetNode && sourceNode !== targetNode) {
            estadoMapa.enlaces.push({ source: sourceNode, target: targetNode });
            targetNode.incomingSources.push(sourceNode);
        }
    });
    actualizarColoresFlechas();
}

export function actualizarColoresFlechas() {
    estadoMapa.nodos.forEach(nodo => {
        if (nodo.incomingSources.length === 0) {
            nodo.arrowColor = ESTETICA.lineaBase; 
            return;
        }
        
        const total = nodo.incomingSources.length;
        const conocidos = nodo.incomingSources.filter(n => n.esConocido).length;
        
        if (conocidos === total) {
            nodo.arrowColor = ESTETICA.lineaBase; // Por defecto oscuro
        } else if (conocidos > 0) {
            nodo.arrowColor = 'rgba(200, 150, 50, 0.6)'; // Mostaza oscuro
        } else {
            nodo.arrowColor = ESTETICA.lineaNoDescubierto; // Rosa tenue
        }
    });
}
