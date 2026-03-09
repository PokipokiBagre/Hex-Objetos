import { estadoMapa } from './mapa-state.js';

const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycby1jLgF-2bGWv0QW0Eg8u7msZ-ab2eQa--olIWQHsin8Kyz0y0xHevK7YyGyMyzq1BWKw/exec';

export async function cargarDatos(barra) {
    try {
        if(barra) barra.style.width = '30%';
        const res = await fetch(API_HECHIZOS);
        if(barra) barra.style.width = '70%';
        
        const json = JSON.parse(decodeURIComponent(escape(window.atob(await res.text()))));
        procesarNodos(json);
        procesarEnlaces(json.String || []);
        
        if(barra) barra.style.width = '100%';
        return true;
    } catch(e) {
        console.error("Error cargando mapa:", e);
        return false;
    }
}

function procesarNodos(json) {
    const todos = [...(json.nodos || []), ...(json.nodosOcultos || [])];
    estadoMapa.nodos = [];
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // 1. Extraer números crudos (ignorando puntos y comas raras del Excel)
    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;
        
        let rawX = parseFloat(n.X?.toString().replace(/[^0-9\-]/g, '')) || (Math.random() * 1000);
        let rawY = parseFloat(n.Y?.toString().replace(/[^0-9\-]/g, '')) || (Math.random() * 1000);
        
        if (rawX < minX) minX = rawX; if (rawX > maxX) maxX = rawX;
        if (rawY < minY) minY = rawY; if (rawY > maxY) maxY = rawY;

        n._rawX = rawX; n._rawY = rawY;
    });

    let rangeX = (maxX - minX) || 1;
    let rangeY = (maxY - minY) || 1;

    // 2. Normalizar a una cuadrícula perfecta de 4000x4000 para que se vean bien
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
            radio: esConocido ? 30 : 12 // Tamaños distinguibles
        });
    });
}

function procesarEnlaces(arrayStrings) {
    estadoMapa.enlaces = [];
    arrayStrings.forEach(rel => {
        if(!rel.Source || !rel.Target) return;
        
        const norm = (s) => s.toString().trim().toLowerCase();
        const srcVal = norm(rel.Source);
        const tgtVal = norm(rel.Target);

        const sourceNode = estadoMapa.nodos.find(n => norm(n.id) === srcVal || norm(n.nombre) === srcVal);
        const targetNode = estadoMapa.nodos.find(n => norm(n.id) === tgtVal || norm(n.nombre) === tgtVal);

        if (sourceNode && targetNode && sourceNode !== targetNode) {
            estadoMapa.enlaces.push({ source: sourceNode, target: targetNode });
        }
    });
}
