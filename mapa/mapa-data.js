import { estadoMapa } from './mapa-state.js';

const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycby1jLgF-2bGWv0QW0Eg8u7msZ-ab2eQa--olIWQHsin8Kyz0y0xHevK7YyGyMyzq1BWKw/exec';

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

// Lector de coordenadas a prueba de formatos extraños
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
    
    // 1. Recopilamos datos crudos
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
            hexNodeRaw = n; // Detectamos el nodo central!
        }
    });

    // 2. Establecer el Origen del Universo en el Nodo HEX
    let originX = hexNodeRaw ? hexNodeRaw._rawX : 0;
    let originY = hexNodeRaw ? hexNodeRaw._rawY : 0;

    // Calcular el rango máximo desde el origen para escalar proporcionalmente
    let maxDist = 1;
    todos.forEach(n => {
        let dx = Math.abs(n._rawX - originX);
        let dy = Math.abs(n._rawY - originY);
        if (dx > maxDist) maxDist = dx;
        if (dy > maxDist) maxDist = dy;
    });

    // 3. Crear Nodos Normalizados
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

        // Anclamos al HEX y multiplicamos por -1 la Y (Canvas dibuja la Y al revés)
        const x = ((n._rawX - originX) / maxDist) * 5000;
        const y = -((n._rawY - originY) / maxDist) * 5000; 

        let radio = esConocido ? 20 : 12;
        if (isHexNode) radio = 40;

        estadoMapa.nodos.push({
            id: idReal,
            nombreOriginal: nombreReal,
            nombre: nombreMostrar,
            afinidad: esConocido ? (n.Afinidad || 'Desconocida') : 'Sellada',
            clase: n.Clase || '-',
            hex: hexCost,
            resumen: esConocido ? (n.Resumen || 'Sin descripción') : 'El conocimiento de este nodo permanece sellado.',
            efecto: esConocido ? (n.Efecto || '') : '',
            esConocido: esConocido,
            isHexNode: isHexNode,
            x: x,
            y: y,
            radio: radio,
            incomingSources: [] // Guardará los nodos que apuntan hacia este
        });
    });
}

function procesarEnlaces(arrayStrings) {
    estadoMapa.enlaces = [];
    
    // Buscador Inteligente: Conecta "Hechizo 1" con "1" sin importar mayúsculas
    const findNode = (val) => {
        if (!val) return null;
        const s = String(val).trim().toLowerCase();
        const sNumMatch = s.match(/^hechizo\s+(\d+)$/);
        const sNum = sNumMatch ? sNumMatch[1] : s;

        return estadoMapa.nodos.find(n => {
            const nid = String(n.id).trim().toLowerCase();
            const nnom = String(n.nombreOriginal).trim().toLowerCase();
            return nid === s || nnom === s || nid === sNum || nnom === sNum || `hechizo ${nid}` === s || `hechizo ${nnom}` === s;
        });
    };

    arrayStrings.forEach(rel => {
        const srcKey = Object.keys(rel).find(k => k.trim().toLowerCase() === 'source');
        const tgtKey = Object.keys(rel).find(k => k.trim().toLowerCase() === 'target');
        if(!srcKey || !tgtKey) return;

        const sourceNode = findNode(rel[srcKey]);
        const targetNode = findNode(rel[tgtKey]);

        if (sourceNode && targetNode && sourceNode !== targetNode) {
            estadoMapa.enlaces.push({ source: sourceNode, target: targetNode });
            targetNode.incomingSources.push(sourceNode);
        }
    });

    // 4. LÓGICA DE COLOR DE FLECHAS BASADA EN REQUISITOS
    estadoMapa.nodos.forEach(nodo => {
        if (nodo.incomingSources.length === 0) {
            nodo.arrowColor = 'rgba(255, 255, 255, 0.4)'; 
            return;
        }
        
        const total = nodo.incomingSources.length;
        const conocidos = nodo.incomingSources.filter(n => n.esConocido).length;
        
        if (conocidos === total) {
            nodo.arrowColor = 'rgba(255, 255, 255, 0.9)'; // BLANCAS: Todos los requisitos descubiertos
        } else if (conocidos > 0) {
            nodo.arrowColor = 'rgba(255, 200, 0, 0.8)'; // MOSTAZA: Parcialmente descubiertos
        } else {
            nodo.arrowColor = 'rgba(255, 100, 150, 0.7)'; // ROSA/ROJO: Ninguno descubierto
        }
    });
}
