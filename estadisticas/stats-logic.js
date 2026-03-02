import { statsGlobal } from './stats-state.js';

export function calcularFicha(id) {
    const s = statsGlobal[id]; if(!s) return null;

    // 1. Modificadores por Hechizos Aprendidos (+1 afinidad por cada hechizo)
    const countSpells = (tipo) => s.learnedSpells.filter(sp => sp.afin.toLowerCase().includes(tipo.toLowerCase())).length;

    const fFin = {
        fis: s.afin.fis + countSpells('Física'),
        ene: s.afin.ene + countSpells('Energética'),
        esp: s.afin.esp + countSpells('Espiritual'),
        man: s.afin.man + countSpells('Mando'),
        psi: s.afin.psi + countSpells('Psíquica'),
        osc: s.afin.osc + countSpells('Oscura')
    };

    // 2. Bonos RAD
    // +1 Corazón Rojo por cada 2 Psíquica
    const bRoja = Math.floor(fFin.psi / 2);
    // +1 Azul por cada 4 de (Ene, Esp, Psi, Man)
    const bAzul = Math.floor((fFin.ene + fFin.esp + fFin.psi + fFin.man) / 4);
    // Vex: Redondeado a 50 por cada 75 (Oscura*75)
    const rawVex = fFin.osc * 75;
    const bVex = Math.round(rawVex / 50) * 50;

    return {
        roja: s.vida.actual,
        rojaMax: s.vida.maxBase + bRoja,
        azul: s.vida.azul + bAzul,
        oro: s.vida.oro,
        hex: s.hex,
        vexMax: s.vex + bVex,
        vexActual: s.vex,
        afin: fFin,
        spells: s.learnedSpells
    };
}
