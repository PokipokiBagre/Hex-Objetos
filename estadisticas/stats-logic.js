import { statsGlobal } from './stats-state.js';

export function calcularFicha(id) {
    const s = statsGlobal[id]; if(!s) return null;

    // +1 Afin por cada hechizo de ese tipo aprendido
    const getBonus = (tipo) => s.hechizos.afin.filter(a => a.toLowerCase().includes(tipo.toLowerCase())).length;

    const fFin = {
        fis: s.fi + getBonus('Física'), ene: s.en + getBonus('Energética'),
        esp: s.es + getBonus('Espiritual'), man: s.ma + getBonus('Mando'),
        psi: s.ps + getBonus('Psíquica'), osc: s.os + getBonus('Oscura')
    };

    // Bonos RAD: +1 Roja/2 Psi | +1 Azul/4 (Ene, Esp, Psi, Man)
    const bRoja = Math.floor(fFin.psi / 2);
    const bAzul = Math.floor((fFin.ene + fFin.esp + fFin.psi + fFin.man) / 4);

    return {
        hx: s.hx, r: s.r, rm: s.rm + bRoja, az: s.az + bAzul, gd: s.gd,
        afin: fFin,
        spellCount: s.hechizos.noms.length,
        spells: s.hechizos.noms.map((n, i) => ({ n, a: s.hechizos.afin[i], c: s.hechizos.cost[i] })).filter(x => x.n)
    };
}
