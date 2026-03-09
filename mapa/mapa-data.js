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

// Extractor puro de decimales para Gephi
function parseGephiCoord(val) {
    if (val === undefined || val === null || val === '') return null;
    let str = String(val).replace(',', '.'); 
    let num = parseFloat(str);
    return isNaN(num) ? null : num;
}

function procesarNodos(json) {
    const todos = [].concat(json.nodos || []).concat(json.nodosOcultos || []);
    estadoMapa.nodos = [];
    const nodosProcesados = new Set();

    todos.forEach(n => {
        if (!n.ID && !n.Nombre) return;

        const idReal = n.ID ? n.ID.toString().trim() : '';
        const nombreReal = n.Nombre && n.Nombre.trim() !== "" ? n.Nombre.trim() : idReal;

        const idUnico = (idReal || nombreReal).toLowerCase();
        if (nodosProcesados.has(idUnico)) return;
        nodosProcesados.add(idUnico);

        const esConocido = n.Conocido && n.Conocido.toString().trim().toLowerCase() === 'si';
        const hexCost = parseInt(n.HEX) || 0;

        // LÓGICA DE ENMASCARAMIENTO (Niebla de Guerra)
        let nombreMostrar = "";
        if (esConocido) {
            nombreMostrar = `${nombreReal} (${hexCost})`;
        } else {
            // Si el ID ya dice "Hechizo X", lo dejamos, si no, se lo ponemos.
            let maskName = idReal.toLowerCase().includes('hechizo') ? idReal : `Hechizo ${idReal}`;
            nombreMostrar = `${maskName} (${hexCost})`;
        }

        // Mantenemos la pureza matemática de tu Gephi
        let rawX = parseGephiCoord(n.X) ?? parseGephiCoord(n.x);
        let rawY = parseGephiCoord(n.Y) ?? parseGephiCoord(n.y);

        if (rawX === null) rawX = Math.random() * 500;
        if (rawY === null) rawY = Math.random() * 500;

        const escalaGephi = 4; // Ampliamos la red para que no se pisen los nombres

        estadoMapa.nodos.push({
            id: idReal || nombreReal, // Fundamental para que las líneas sepan a quién conectarse
            nombreOriginal: nombreReal, // Guardado interno
            nombre: nombreMostrar, // Lo que ve el usuario
            afinidad: esConocido ? (n.Afinidad || 'Desconocida') : 'Sellada',
            clase: n.Clase || '-',
            hex: hexCost,
            resumen: esConocido ? (n.Resumen || 'Sin descripción') : 'El conocimiento de este nodo permanece sellado.',
            efecto: esConocido ? (n.Efecto || '') : '',
            esConocido: esConocido,
            x: rawX * escalaGephi,
            y: rawY * escalaGephi,
            radio: esConocido ? 24 : 12 // Más pequeños para denotar que no están descubiertos
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

        // Buscamos coincidencias usando el ID o el Nombre Original (ignorando la máscara)
        const sourceNode = estadoMapa.nodos.find(n => norm(n.id) === srcVal || norm(n.nombreOriginal) === srcVal);
        const targetNode = estadoMapa.nodos.find(n => norm(n.id) === tgtVal || norm(n.nombreOriginal) === tgtVal);

        if (sourceNode && targetNode && sourceNode !== targetNode) {
            estadoMapa.enlaces.push({ source: sourceNode, target: targetNode });
        }
    });
}
