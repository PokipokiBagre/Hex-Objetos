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

// Extractor a prueba de balas: Ignora puntos y comas para evitar que los números colapsen la escala
function parseGephiCoord(val) {
    if (val === undefined || val === null || val === '') return null;
    let str = String(val).replace(/[^0-9\-]/g, ''); 
    let num = parseInt(str, 10);
    return isNaN(num) ? null : num;
}

function procesarNodos(json) {
    const todos = [].concat(json.nodos || []).concat(json.nodosOcultos || []);
    estadoMapa.nodos = [];
    const nodosProcesados = new Set();
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // 1. Recopilar coordenadas en bruto
    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;
        
        let rawX = parseGephiCoord(n.X) ?? parseGephiCoord(n.x) ?? (Math.random() * 100);
        let rawY = parseGephiCoord(n.Y) ?? parseGephiCoord(n.y) ?? (Math.random() * 100);

        if (rawX < minX) minX = rawX; 
        if (rawX > maxX) maxX = rawX;
        if (rawY < minY) minY = rawY; 
        if (rawY > maxY) maxY = rawY;

        n._rawX = rawX; 
        n._rawY = rawY;
    });

    // 2. Calcular el centro del círculo de Gephi
    let rangeX = maxX - minX;
    let rangeY = maxY - minY;
    let maxRange = Math.max(rangeX, rangeY);
    if (maxRange === 0 || isNaN(maxRange)) maxRange = 1;

    let centerX = minX + rangeX / 2;
    let centerY = minY + rangeY / 2;

    // 3. Normalizar y Enmascarar
    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;

        const idReal = n.ID ? n.ID.toString().trim() : '';
        const nombreReal = n.Nombre && n.Nombre.trim() !== "" ? n.Nombre.trim() : idReal;

        const idUnico = (idReal || nombreReal).toLowerCase();
        if (nodosProcesados.has(idUnico)) return;
        nodosProcesados.add(idUnico);

        const esConocido = n.Conocido && n.Conocido.toString().trim().toLowerCase() === 'si';
        const hexCost = parseInt(n.HEX) || 0;
        const isHexNode = (idUnico === 'hex');

        // LÓGICA DE ENMASCARAMIENTO (Sellado)
        let nombreMostrar = "";
        if (esConocido || isHexNode) {
            nombreMostrar = isHexNode ? "HEX" : `${nombreReal} (${hexCost})`;
        } else {
            let maskName = idReal.toLowerCase().includes('hechizo') ? idReal : `Hechizo ${idReal}`;
            nombreMostrar = `${maskName} (${hexCost})`;
        }

        // TRASLADAR GEPHI A NUESTRA PANTALLA (Conservando la forma de círculo perfecto)
        const x = ((n._rawX - centerX) / maxRange) * 4000;
        const y = ((n._rawY - centerY) / maxRange) * 4000;

        let radio = esConocido ? 22 : 12;
        if (isHexNode) radio = 40; // El centro es más grande

        estadoMapa.nodos.push({
            id: idReal || nombreReal,
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
            radio: radio
        });
    });
}

function procesarEnlaces(arrayStrings) {
    estadoMapa.enlaces = [];
    arrayStrings.forEach(rel => {
        if(!rel.Source || !rel.Target) return;
        
        const norm = (s) => String(s).trim().toLowerCase();
        const srcVal = norm(rel.Source);
        const tgtVal = norm(rel.Target);

        const sourceNode = estadoMapa.nodos.find(n => norm(n.id) === srcVal || norm(n.nombreOriginal) === srcVal);
        const targetNode = estadoMapa.nodos.find(n => norm(n.id) === tgtVal || norm(n.nombreOriginal) === tgtVal);

        if (sourceNode && targetNode && sourceNode !== targetNode) {
            estadoMapa.enlaces.push({ source: sourceNode, target: targetNode });
        }
    });
}
