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
    const nameToId = {}; 
    const idToName = {};
    
    todosNodos.forEach(n => { 
        if(n.Nombre && n.ID) {
            const idNorm = norm(n.ID);
            const nombreNorm = norm(n.Nombre);
            const isPlaceholder = n.Nombre.trim().toLowerCase().startsWith("hechizo");
            
            nameToId[nombreNorm] = idNorm;
            
            // LA MAGIA AQUÍ: Solo guarda el nombre en idToName si no existe, 
            // o si el que estaba guardado era "Hechizo X" y el nuevo es un nombre real "HEX (50)".
            if (!idToName[idNorm] || (!isPlaceholder && idToName[idNorm].toLowerCase().startsWith("hechizo"))) {
                idToName[idNorm] = n.Nombre.trim();
            }
        } 
    });

    const invNombres = getInventarioCombinado(nombrePj).map(i => norm(i.Hechizo));
    const invIDs = new Set(invNombres.map(n => nameToId[n]).filter(Boolean));
    
    const reqs = {};
    db.hechizos.string.forEach(rel => {
        const src = norm(rel.Source); const tgt = norm(rel.Target);
        if(!src || !tgt) return; 
        if(!reqs[tgt]) reqs[tgt] = []; reqs[tgt].push(src);
    });

    const grupos = {};
    const fAf = estadoUI.filtrosAprendizaje.afinidad;
    const fCl = estadoUI.filtrosAprendizaje.clase;
    const fTx = estadoUI.filtrosAprendizaje.busqueda.toLowerCase();
    
    for (const [tgtID, sources] of Object.entries(reqs)) {
        if (invIDs.has(tgtID)) continue; 
        
        // Si posee AL MENOS UNO de los precedentes
        if (sources.some(s => invIDs.has(s))) {
            const info = todosNodos.find(n => norm(n.ID) === tgtID);
            if(info) {
                if(fAf !== 'Todos' && info.Afinidad !== fAf) continue;
                if(fCl !== 'Todos' && (!info.Clase || !info.Clase.includes(fCl))) continue;
                if(fTx && !info.Nombre.toLowerCase().includes(fTx) && !info.ID.toLowerCase().includes(fTx)) continue;

                const reqStrArray = sources.map(s => {
                    const isOwned = invIDs.has(s);
                    // Busca el nombre real (ej. "HEX (50)"), si no lo encuentra usa "Hechizo 1"
                    const realName = idToName[s] || formatearID(s);
                    
                    // Si lo tiene, muestra su nombre real + EN POSESIÓN. Si no, muestra su ID/Placeholder.
                    return isOwned ? `${realName.toUpperCase()} (EN POSESIÓN)` : formatearID(s).toUpperCase();
                });
                
                const reqStr = reqStrArray.join(" + ");
                if(!grupos[reqStr]) grupos[reqStr] = [];
                grupos[reqStr].push(info);
            }
        }
    }
    return grupos;
}
