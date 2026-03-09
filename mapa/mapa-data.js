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

function cleanCoord(val) {
    if (val === undefined || val === null || val === '') return null;
    let str = String(val).replace(/[^0-9\-]/g, '');
    let parsed = parseFloat(str);
    return isNaN(parsed) ? null : parsed;
}

function procesarNodos(json) {
    const todos = [].concat(json.nodos || []).concat(json.nodosOcultos || []);
    estadoMapa.nodos = [];
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Primer paso: Recopilar coordenadas crudas y hallar límites
    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;
        
        let rawX = cleanCoord(n.X) || cleanCoord(n.x);
        let rawY = cleanCoord(n.Y) || cleanCoord(n.y);

        if (rawX === null) rawX = Math.random() * 1000;
        if (rawY === null) rawY = Math.random() * 1000;
        
        if (rawX < minX) minX = rawX; 
        if (rawX > maxX) maxX = rawX;
        if (rawY < minY) minY = rawY; 
        if (rawY > maxY) maxY = rawY;

        n._rawX = rawX; 
        n._rawY = rawY;
    });

    let rangeX = maxX - minX;
    let rangeY = maxY - minY;
    
    if (rangeX === 0 || isNaN(rangeX)) rangeX = 1;
    if (rangeY === 0 || isNaN(rangeY)) rangeY = 1;

    // Segundo paso: Normalizar a un mapa perfecto de 4000x4000
    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;
        const nombreReal = n.Nombre && n.Nombre.trim() !== "" ? n.Nombre : n.ID;
        const esConocido = n.Conocido && n.Conocido.toString().trim().toLowerCase() === 'si';
        
        const x = ((n._rawX - minX) / rangeX) * 4000 - 2000;
        const y = ((n._rawY - minY) / rangeY) * 4000 - 2000;
        
        estadoMapa.nodos.push({
            id: n.ID ? n.ID.toString().trim() : nombreReal,
            nombre: nombreReal,
            afinidad: n.Afinidad || 'Desconocida',
            clase: n.Clase || '-',
            hex: parseInt(n.HEX) || 0,
            resumen: n.Resumen || (esConocido ? 'Sin descripción' : 'Información Sellada'),
            efecto: n.Efecto || '',
            esConocido: esConocido,
            x: x,
            y: y,
            radio: esConocido ? 30 : 12
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

        const sourceNode = estadoMapa.nodos.find(n => norm(n.id) === srcVal || norm(n.nombre) === srcVal);
        const targetNode = estadoMapa.nodos.find(n => norm(n.id) === tgtVal || norm(n.nombre) === tgtVal);

        if (sourceNode && targetNode && sourceNode !== targetNode) {
            estadoMapa.enlaces.push({ source: sourceNode, target: targetNode });
        }
    });
}
