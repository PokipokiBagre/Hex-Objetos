import { statsGlobal } from './stats-state.js';

export function calcularFicha(id) {
    const s = statsGlobal[id]; if(!s) return null;

    // 1. +1 Afinidad por cada hechizo de ese tipo aprendido
    const getSpellBonus = (tipo) => s.learnedSpells.filter(sp => sp.afin.toLowerCase().includes(tipo.toLowerCase())).length;

    const afinFin = {
        fis: s.afin.fis + getSpellBonus('Física'),
        ene: s.afin.ene + getSpellBonus('Energética'),
        esp: s.afin.esp + getSpellBonus('Espiritual'),
        man: s.afin.man + getSpellBonus('Mando'),
        psi: s.afin.psi + getSpellBonus('Psíquica'),
        osc: s.afin.osc + getSpellBonus('Oscura')
    };

    // 2. Bonos Vitalidad: +1 Roja/2 Psi | +1 Azul/4 (Ene, Esp, Psi, Man)
    const bRoja = Math.floor(afinFin.psi / 2);
    const bAzul = Math.floor((afinFin.ene + afinFin.esp + afinFin.psi + afinFin.man) / 4);

    // 3. Capacidad Vex: (Oscura * 75) redondeado a 50
    const rawVex = afinFin.osc * 75;
    const bVex = Math.round(rawVex / 50) * 50;

    return {
        roja: s.vida.actual, rojaMax: s.vida.maxBase + bRoja,
        azul: s.vida.azul + bAzul, oro: s.vida.oro,
        hex: s.hex, vexMax: s.vex + bVex, vexActual: s.vex,
        afin: afinFin, spells: s.learnedSpells
    };
}
