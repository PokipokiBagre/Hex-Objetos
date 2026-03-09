import { estadoMapa } from './mapa-state.js';

export const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycby1jLgF-2bGWv0QW0Eg8u7msZ-ab2eQa--olIWQHsin8Kyz0y0xHevK7YyGyMyzq1BWKw/exec';

export async function cargarDatos(barra) {
    try {
        if(barra) barra.style.width = '30%';
        const res = await fetch(API_HECHIZOS);
        if(barra) barra.style.width = '70%';

        const jsonText = await res.text();
        const json = JSON.parse(decodeURIComponent(escape(window.atob(jsonText))));
        
        procesarNodos(json);
        procesarEnlaces(json.String || []);
        
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
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

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

    let maxDist = 1;
    todos.forEach(n => {
        let dx = Math.abs(n._rawX - originX);
        let dy = Math.abs(n._rawY - originY);
        if (dx > maxDist) maxDist = dx;
        if (dy > maxDist) maxDist = dy;
    });

    // Guardamos la matemática para poder hacer el cálculo inverso al arrastrar
    estadoMapa.math.originX = originX;
    estadoMapa.math.originY = originY;
    estadoMapa.math.maxDist = maxDist;

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

        const x = ((n._rawX - originX) / maxDist) * 5000;
        const y = -((n._rawY - originY) / maxDist) * 5000; 

        estadoMapa.nodos.push({
            id: idReal,
            nombreOriginal: nombreReal,
            nombre: nombreMostrar,
            afinidad: n.Afinidad || 'Desconocida', // Guardamos la real para pintar
            clase: n.Clase || '-',
            hex: hexCost,
            resumen: n.Resumen || 'Sin descripción',
            efecto: n.Efecto || '',
            esConocido: esConocido,
            isHexNode: isHexNode,
            x: x,
            y: y,
            _rawX: n._rawX, // Coord original de Excel
            _rawY: n._rawY,
            radio: isHexNode ? 40 : (esConocido ? 20 : 12),
            incomingSources: [],
            modificado: false // Bandera para API
        });
    });
}

function procesarEnlaces(arrayStrings) {
    estadoMapa.enlaces = [];
    
    const findNode = (val) => {
        if (!val) return null;
        const original = String(val).trim().toLowerCase();
        const coreVal = original.replace(/hechizo/g, '').replace(/_/g, ' ').trim();

        return estadoMapa.nodos.find(n => {
            const nid = String(n.id).trim().toLowerCase();
            const nnom = String(n.nombreOriginal).trim().toLowerCase().replace(/_/g, ' ');
            const coreId = nid.replace(/hechizo/g, '').trim();
            const coreNom = nnom.replace(/hechizo/g, '').trim();

            return nid === original || nnom === original || coreId === coreVal || coreNom === coreVal;
        });
    };

    arrayStrings.forEach(rel => {
        if (!rel) return;
        let srcVal, tgtVal;

        if (Array.isArray(rel)) {
            srcVal = rel[0]; tgtVal = rel[1];
        } else {
            const srcKey = Object.keys(rel).find(k => k.trim().toLowerCase() === 'source');
            const tgtKey = Object.keys(rel).find(k => k.trim().toLowerCase() === 'target');
            srcVal = srcKey ? rel[srcKey] : Object.values(rel)[0];
            tgtVal = tgtKey ? rel[tgtKey] : Object.values(rel)[1];
        }

        if (!srcVal || !tgtVal) return;

        const sourceNode = findNode(srcVal);
        const targetNode = findNode(tgtVal);

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
            nodo.arrowColor = 'rgba(255, 255, 255, 0.4)'; 
            return;
        }
        
        const total = nodo.incomingSources.length;
        const conocidos = nodo.incomingSources.filter(n => n.esConocido).length;
        
        if (conocidos === total) {
            nodo.arrowColor = 'rgba(255, 255, 255, 0.95)'; // BLANCAS
        } else if (conocidos > 0) {
            nodo.arrowColor = 'rgba(255, 200, 0, 0.9)'; // MOSTAZA
        } else {
            nodo.arrowColor = 'rgba(255, 100, 150, 0.7)'; // ROSA
        }
    });
}
