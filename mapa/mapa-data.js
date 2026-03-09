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

// Limpiador seguro para extraer los números de Gephi sin que los puntos rompan el valor
function parseGephiCoord(val) {
    if (val === undefined || val === null || val === '') return null;
    let str = String(val).replace(/[^0-9\-]/g, '');
    let num = parseInt(str, 10);
    return isNaN(num) ? null : num;
}

function procesarNodos(json) {
    const todos = [].concat(json.nodos || []).concat(json.nodosOcultos || []);
    estadoMapa.nodos = [];
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // 1. Extraer coordenadas en bruto
    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;
        
        let rawX = parseGephiCoord(n.X) || parseGephiCoord(n.x);
        let rawY = parseGephiCoord(n.Y) || parseGephiCoord(n.y);

        if (rawX === null) rawX = Math.random() * 1000 - 500;
        if (rawY === null) rawY = Math.random() * 1000 - 500;
        
        if (rawX < minX) minX = rawX; 
        if (rawX > maxX) maxX = rawX;
        if (rawY < minY) minY = rawY; 
        if (rawY > maxY) maxY = rawY;

        n._rawX = rawX; 
        n._rawY = rawY;
    });

    let rangeX = maxX - minX;
    let rangeY = maxY - minY;
    
    // USAR EL RANGO MÁXIMO PARA NO DEFORMAR EL CÍRCULO (Preserva el Aspect Ratio de Gephi)
    let maxRange = Math.max(rangeX, rangeY);
    if (maxRange === 0 || isNaN(maxRange)) maxRange = 1;

    // 2. Escalar proporcionalmente a un espacio de trabajo amigable
    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;
        const nombreReal = n.Nombre && n.Nombre.trim() !== "" ? n.Nombre : n.ID;
        const esConocido = n.Conocido && n.Conocido.toString().trim().toLowerCase() === 'si';
        
        const x = ((n._rawX - minX) / maxRange) * 4000 - 2000;
        const y = ((n._rawY - minY) / maxRange) * 4000 - 2000;
        
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
            radio: esConocido ? 30 : 12 // Destaca los descubiertos
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

        // Evitar que un nodo apunte a sí mismo por error
        if (sourceNode && targetNode && sourceNode !== targetNode) {
            estadoMapa.enlaces.push({ source: sourceNode, target: targetNode });
        }
    });
}
