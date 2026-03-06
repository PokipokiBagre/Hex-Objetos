import { db, estadoUI } from './inventario-state.js';

const norm = (s) => s ? s.toString().trim().toLowerCase() : '';
const formatearID = (id) => id.replace(/hechizo/i, 'Hechizo').trim();

export function getInventarioCombinado(nombrePj) {
    const invReal = db.hechizos.inventario.filter(i => i.Personaje === nombrePj);
    const enColaAdd = estadoUI.colaCambios.agregar.filter(c => c[0] === nombrePj).map(c => ({ Personaje: c[0], Hechizo: c[1], "Hechizo Afinidad": c[2], "Hechizo Hex": c[3], Tipo: c[4], Origen: c[5] }));
    const nQuitar = estadoUI.colaCambios.quitar.filter(c => c.Personaje === nombrePj).map(c => c.Hechizo);
    return [...invReal, ...enColaAdd].filter(item => !nQuitar.includes(item.Hechizo));
}

// Devuelve el SET de hechizos de Jugadores (Guarda tanto el Nombre como el ID para evitar bloqueos falsos)
export function getHechizosDeJugadores() {
    const jugadores = Object.keys(db.personajes).filter(k => db.personajes[k].isPlayer);
    const descubiertos = new Set();
    const todosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    
    jugadores.forEach(pj => {
        getInventarioCombinado(pj).forEach(item => {
            const invNorm = norm(item.Hechizo);
            descubiertos.add(invNorm);
            
            // Registramos también el ID o el Nombre asociado para que haga "Match" con los NPCs
            const info = todosNodos.find(n => norm(n.Nombre) === invNorm || norm(n.ID) === invNorm);
            if (info) {
                if (info.Nombre) descubiertos.add(norm(info.Nombre));
                if (info.ID) descubiertos.add(norm(info.ID));
            }
        });
    });
    return descubiertos;
}

export function obtenerHechizosAprendibles(nombrePj) {
    const todosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];
    const nameToId = {}; 
    const idToName = {};
    
    todosNodos.forEach(n => { 
        const idNorm = norm(n.ID);
        const nom = n.Nombre ? n.Nombre.trim() : '';
        const nomNorm = norm(nom);

        if(nomNorm && idNorm) {
            nameToId[nomNorm] = idNorm;
            if (!nom.toLowerCase().startsWith('hechizo')) {
                idToName[idNorm] = nom;
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
        
        if (sources.some(s => invIDs.has(s))) {
            const info = todosNodos.find(n => norm(n.ID) === tgtID);
            if(info) {
                if(fAf !== 'Todos' && info.Afinidad !== fAf) continue;
                if(fCl !== 'Todos' && (!info.Clase || !info.Clase.includes(fCl))) continue;
                if(fTx && !info.Nombre.toLowerCase().includes(fTx) && !info.ID.toLowerCase().includes(fTx)) continue;

                const reqStrArray = sources.map(s => {
                    const isOwned = invIDs.has(s);
                    const realName = idToName[s] || formatearID(s);
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
