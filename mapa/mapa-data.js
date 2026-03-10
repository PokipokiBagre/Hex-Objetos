import { estadoMapa, ESTETICA } from './mapa-state.js';

export const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycby1jLgF-2bGWv0QW0Eg8u7msZ-ab2eQa--olIWQHsin8Kyz0y0xHevK7YyGyMyzq1BWKw/exec';
const CSV_ESTADISTICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv';

export async function cargarDatos(barra) {
    try {
        if(barra) barra.style.width = '10%';
        
        // 1. CARGAMOS A LOS JUGADORES DESDE EL CSV DE ESTADÍSTICAS
        const csvRes = await fetch(CSV_ESTADISTICAS);
        const csvText = await csvRes.text();
        procesarCSVJugadores(csvText);
        
        if(barra) barra.style.width = '25%';

        // 2. CARGAMOS LA API PRINCIPAL (NODOS E INVENTARIO)
        const res = await fetch(API_HECHIZOS);
        if(barra) barra.style.width = '60%';

        const jsonText = await res.text();
        const json = JSON.parse(decodeURIComponent(escape(window.atob(jsonText))));
        
        procesarInventario(json);
        procesarNodos(json);
        procesarEnlaces(json.String || json.string || json.Strings || []);
        
        if(barra) barra.style.width = '100%';
        return true;
    } catch(e) {
        console.error("Error cargando mapa:", e);
        return false;
    }
}

function procesarCSVJugadores(csvText) {
    const lines = csvText.split('\n');
    if(lines.length < 1) return;
    const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
    const pIdx = headers.indexOf('Personaje');
    const jIdx = headers.indexOf('Jugador_Activo');
    
    estadoMapa.jugadores = [];
    if (pIdx > -1 && jIdx > -1) {
        for(let i = 1; i < lines.length; i++) {
            let row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if(row.length > jIdx) {
                let jActivo = row[jIdx].trim().replace(/\r/g, '');
                if(jActivo === '1_1') {
                    estadoMapa.jugadores.push(row[pIdx].trim().replace(/^"|"$/g, ''));
                }
            }
        }
    }
}

function procesarInventario(json) {
    estadoMapa.inventario = {};
    if (json.inventario) {
        json.inventario.forEach(row => {
            let pj = row.Personaje ? row.Personaje.trim() : '';
            let he = row.Hechizo ? row.Hechizo.trim() : '';
            if(pj && he) {
                if(!estadoMapa.inventario[pj]) estadoMapa.inventario[pj] = new Set();
                // Limpiamos el texto para poder emparejarlo con el Nodo
                estadoMapa.inventario[pj].add(he.replace(/\s*\(\d+\)$/, '').trim().toLowerCase());
            }
        });
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

    const isGephiRaw = maxXDist > 15000 || maxYDist > 15000;
    const radioExpansion = 3500; 

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

        let x, y;
        if (isGephiRaw) {
            x = ((n._rawX - originX) / maxXDist) * radioExpansion;
            y = -((n._rawY - originY) / maxYDist) * radioExpansion; 
        } else {
            x = n._rawX;
            y = n._rawY;
        }

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
            _rawX: x, 
            _rawY: y,
            radio: radio,
            incomingSources: [],
            modificado: isGephiRaw 
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
            nodo.arrowColor = ESTETICA.lineaDescubierta; 
            return;
        }
        
        const total = nodo.incomingSources.length;
        const conocidos = nodo.incomingSources.filter(n => n.esConocido).length;
        
        if (conocidos === total) {
            nodo.arrowColor = ESTETICA.lineaDescubierta; 
        } else if (conocidos > 0) {
            nodo.arrowColor = ESTETICA.lineaMostaza; 
        } else {
            nodo.arrowColor = ESTETICA.lineaRosa; 
        }
    });
}
