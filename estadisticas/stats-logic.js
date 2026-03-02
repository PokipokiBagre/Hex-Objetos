import { statsGlobal, guardarStats } from './stats-state.js';

export function calcularBonos(jugador) {
    const s = statsGlobal[jugador];
    if (!s) return null;

    // REGLAS HEX: +1 Roja/2 Física | +1 Azul/4 Mágicas | +75 Vex/1 Oscura
    return {
        bonoRoja: Math.floor(s.afin.fis / 2),
        bonoAzul: Math.floor((s.afin.ene + s.afin.esp + s.afin.psi + s.afin.man) / 4),
        bonoVex: s.afin.osc * 75
    };
}

export function descargarCSVStats() {
    let csv = "\uFEFFPersonaje,Nombre,Bio,Hex,AumHex,Vex,AumVex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,HechizosAfin,HechizosNom,HechizosHex,CorRojos,CorAzules,GuardaOro\n";
    
    Object.keys(statsGlobal).sort().forEach(p => {
        const d = statsGlobal[p];
        const spA = d.learnedSpells.map(s => s.afinidad).join(',');
        const spN = d.learnedSpells.map(s => s.nombre).join(',');
        const spH = d.learnedSpells.map(s => s.costo).join(',');

        csv += `"${p}","${d.nombreFull}","${d.bio}",${d.hex},0,${d.vex},0,${d.afin.fis},${d.afin.ene},${d.afin.esp},${d.afin.man},${d.afin.psi},${d.afin.osc},"${spA}","${spN}","${spH}","${d.vida.roja}",${d.vida.azul},${d.vida.oro}\n`;
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `HEX_ESTADISTICAS_EXPORT.csv`;
    link.click();
}
