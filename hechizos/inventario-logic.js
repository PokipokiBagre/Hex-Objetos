import { db, estadoUI } from './inventario-state.js';

const norm = (s) => s ? s.toString().trim().toLowerCase() : '';
const formatearID = (id) => id.replace(/hechizo/i, 'Hechizo').trim();

export function getInventarioCombinado(nombrePj) {
    const invReal = db.hechizos.inventario.filter(i => i.Personaje === nombrePj);
    const enColaAdd = estadoUI.colaCambios.agregar.filter(c => c[0] === nombrePj).map(c => ({ Personaje: c[0], Hechizo: c[1], "Hechizo Afinidad": c[2], "Hechizo Hex": c[3], Tipo: c[4], Origen: c[5] }));
    const nQuitar = estadoUI.colaCambios.quitar.filter(c => c.Personaje === nombrePj).map(c => c.Hechizo);
    return [...invReal, ...enColaAdd].filter(item => !nQuitar.includes(item.Hechizo));
}

export function obtenerHechizosAprendibles(nombrePj) {
    const todosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    const nameToId = {}; const idToName = {};
    
    todosNodos.forEach(n => { 
        if(n.Nombre && n.ID) {
            nameToId[norm(n.Nombre)] = norm(n.ID);
            idToName[norm(n.ID)] = n.Nombre;
        } 
    });

    const invNombres = getInventarioCombinado(nombrePj).map(i => norm(i.Hechizo));
    const invIDs = new Set(invNombres.map(n => nameToId[n]).filter(Boolean));
    
    const reqs = {}; // { TargetID: [SourceID_1, SourceID_2] }
    db.hechizos.string.forEach(rel => {
        const src = norm(rel.Source); const tgt = norm(rel.Target);
        if(!src || !tgt) return; 
        if(!reqs[tgt]) reqs[tgt] = []; reqs[tgt].push(src);
    });

    const grupos = {};
    const fAf = estadoUI.filtrosAprendizaje.afinidad;
    const fCl = estadoUI.filtrosAprendizaje.clase;
    
    for (const [tgtID, sources] of Object.entries(reqs)) {
        if (invIDs.has(tgtID)) continue; // Ya lo tiene, lo ignoramos
        
        // Mostrar si tiene AL MENOS UN precedente
        if (sources.some(s => invIDs.has(s))) {
            const info = todosNodos.find(n => norm(n.ID) === tgtID);
            if(info) {
                // Aplicar Filtros de Aprendizaje
                if(fAf !== 'Todos' && info.Afinidad !== fAf) continue;
                if(fCl !== 'Todos' && (!info.Clase || !info.Clase.includes(fCl))) continue;

                const reqStr = sources.map(s => {
                    if(invIDs.has(s)) return `${idToName[s] || formatearID(s)} (En posesión)`;
                    return formatearID(s); // Si no lo tiene, muestra ID puro
                }).join(" + ");

                if(!grupos[reqStr]) grupos[reqStr] = [];
                grupos[reqStr].push(info);
            }
        }
    }
    return grupos;
}
