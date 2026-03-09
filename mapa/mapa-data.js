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

// Lector de coordenadas a prueba de errores de Excel
function cleanCoord(val) {
    if (val === undefined || val === null || val === '') return null;
    let str = val.toString().replace(/[\.,]/g, ''); // Quita puntos y comas
    return parseFloat(str);
}

function procesarNodos(json) {
    const todos = [...(json.nodos || []), ...(json.nodosOcultos || [])];
    estadoMapa.nodos = [];

    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;
        const nombreReal = n.Nombre && n.Nombre.trim() !== "" ? n.Nombre : n.ID;
        const esConocido = n.Conocido && n.Conocido.toString().trim().toLowerCase() === 'si';
        
        const x = cleanCoord(n.X) ?? cleanCoord(n.x) ?? (Math.random() * 5000 - 2500);
        const y = cleanCoord(n.Y) ?? cleanCoord(n.y) ?? (Math.random() * 5000 - 2500);
        
        const radio = esConocido ? 35 : 15;

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
            radio: radio
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

        if (sourceNode && targetNode) {
            estadoMapa.enlaces.push({ source: sourceNode, target: targetNode });
        }
    });
}
