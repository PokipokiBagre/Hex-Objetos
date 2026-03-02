import { statsGlobal } from './stats-state.js';

export function calcularFicha(id) {
    const s = statsGlobal[id]; if(!s) return null;

    // +1 Afin por cada hechizo de ese tipo aprendido
    const getBonusSpell = (tipo) => s.learnedSpells.filter(sp => sp.afin.toLowerCase().includes(tipo.toLowerCase())).length;

    const fFin = {
        fis: s.afin.fis + getBonusSpell('Física'),
        ene: s.afin.ene + getBonusSpell('Energética'),
        esp: s.afin.esp + getBonusSpell('Espiritual'),
        man: s.afin.man + getBonusSpell('Mando'),
        psi: s.afin.psi + getBonusSpell('Psíquica'),
        osc: s.afin.osc + getBonusSpell('Oscura')
    };

    // Bonos RAD: +1 Roja/2 Psi | +1 Azul/4 (Ene, Esp, Psi, Man)
    const bRoja = Math.floor(fFin.psi / 2);
    const bAzul = Math.floor((fFin.ene + fFin.esp + fFin.psi + fFin.man) / 4);
    const bVex = Math.round((fFin.osc * 75) / 50) * 50;

    // Escala del círculo (2000 Hex = 110px de diámetro)
    const sizeHX = Math.min(Math.max((s.hex / 2000) * 110, 45), 180);
    const sizeVX = Math.min(Math.max(((s.vex + bVex) / 2000) * 110, 45), 180);

    return {
        r: s.vida.act, rM: s.vida.maxBase + bRoja, a: s.vida.azul + bAzul, o: s.vida.oro,
        hx: s.hex, vxM: s.vex + bVex, vxA: s.vex,
        afin: fFin, spells: s.learnedSpells,
        sHX: sizeHX, sVX: sizeVX
    };
}

export function generarCSV(id, n) {
    return `"${id}",0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,"","",""\n`;
}

