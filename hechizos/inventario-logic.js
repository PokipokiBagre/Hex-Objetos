import { db, estadoUI } from './inventario-state.js';

export function getInventarioCombinado(nombrePj) {
    const invReal = db.hechizos.inventario.filter(i => i.Personaje === nombrePj);
    const enColaAdd = estadoUI.colaCambios.agregar.filter(c => c[0] === nombrePj).map(c => ({ Personaje: c[0], Hechizo: c[1], "Hechizo Afinidad": c[2], "Hechizo Hex": c[3], Tipo: c[4], Origen: c[5] }));
    const nQuitar = estadoUI.colaCambios.quitar.filter(c => c.Personaje === nombrePj).map(c => c.Hechizo);
    return [...invReal, ...enColaAdd].filter(item => !nQuitar.includes(item.Hechizo));
}

export function obtenerHechizosAprendibles(nombrePj) {
    const invNombres = getInventarioCombinado(nombrePj).map(i => i.Hechizo.trim().toLowerCase());
    const setInv = new Set(invNombres);
    
    const reqs = {};
    db.hechizos.string.forEach(rel => {
        const src = rel.Source?.trim().toLowerCase(); const tgt = rel.Target?.trim().toLowerCase();
        if(!src || !tgt) return; if(!reqs[tgt]) reqs[tgt] = []; reqs[tgt].push(src);
    });

    const aprendibles = [];
    const todosNodos = [...(db.hechizos.nodos || []), ...(db.hechizos.nodosOcultos || [])];

    for (const [tgtLow, sources] of Object.entries(reqs)) {
        if (setInv.has(tgtLow)) continue;
        if (sources.every(s => setInv.has(s))) {
            const info = todosNodos.find(n => n.Nombre.trim().toLowerCase() === tgtLow);
            if(info) aprendibles.push(info);
        }
    }
    return aprendibles.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
}
