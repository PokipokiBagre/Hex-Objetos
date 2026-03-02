import { statsGlobal } from './stats-state.js';

export function calcularFicha(id) {
    const s = statsGlobal[id]; if(!s) return null;

    // 1. Bono: +1 afinidad por cada hechizo de ese tipo en la columna Q
    const getBonusAfin = (tipo) => s.spells.afin.filter(a => a.toLowerCase().includes(tipo.toLowerCase())).length;

    const fFin = {
        fis: s.afin.fis + getBonusAfin('Física'),
        ene: s.afin.ene + getBonusAfin('Energética'),
        esp: s.afin.esp + getBonusAfin('Espiritual'),
        man: s.afin.man + getBonusAfin('Mando'),
        psi: s.afin.psi + getBonusAfin('Psíquica'),
        osc: s.afin.osc + getBonusAfin('Oscura')
    };

    // 2. Vitalidad: Base 10 + bonos
    // Roja Max: +1/2 Psíquica
    const bRoja = Math.floor(fFin.psi / 2);
    // Azul: +1/4 (Ene, Esp, Psi, Man)
    const bAzul = Math.floor((fFin.ene + fFin.esp + fFin.psi + fFin.man) / 4);

    // 3. Vex: +75 por Oscura, redondeado a 50
    const rawVexBonus = fFin.osc * 75;
    const bVex = Math.round(rawVexBonus / 50) * 50;

    return {
        roja: s.vida.roja, rojaMax: s.vida.rojaMax + bRoja,
        azul: s.vida.azul + bAzul, oro: s.vida.oro,
        hex: s.hex, vexMax: s.vex + bVex, vexActual: s.vex,
        afin: fFin,
        spellList: s.spells.nom.map((n, i) => ({ nom: n, afin: s.spells.afin[i], hex: s.spells.hex[i] })).filter(x => x.nom)
    };
}
