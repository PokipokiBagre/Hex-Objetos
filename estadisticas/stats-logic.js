import { statsGlobal } from './stats-state.js';

export function calcularTodo(id) {
    const s = statsGlobal[id]; if(!s) return null;

    const f_fin = s.f_base.map((b, i) => b + s.f_modDir[i] + s.f_aumPerm[i] - s.f_disPerm[i] + s.f_aumTemp[i] - s.f_disTemp[i] + s.f_aumHech[i]);
    const bRoja = Math.floor(f_fin[0] / 2);
    const bAzul = Math.floor((f_fin[1] + f_fin[2] + f_fin[3] + f_fin[4]) / 4);

    const r_fin = s.r_base.map((b, i) => {
        const total = b + s.r_modDir[i] + s.r_aumPerm[i] - s.r_disPerm[i] + s.r_aumTemp[i] - s.r_disTemp[i];
        if(i === 1) return total + bRoja; // Max Roja
        if(i === 2) return total + bAzul; // Azules
        return total;
    });

    return {
        roja: r_fin[0], rojaMax: r_fin[1], azul: r_fin[2], oro: r_fin[3],
        hex: s.baseHexVex[0] + s.baseHexVex[1], vexMax: s.baseHexVex[2] + (f_fin[5] * 75), vexCur: s.baseHexVex[2],
        afin: f_fin, nombre: s.nombreFull, bio: s.bio
    };
}

export function exportarCSV() {
    let csv = "\uFEFFPersonaje,Nombre,Desc\tHex,AumH,Vex,AumV\tFEEMPO...\n"; // Sigue tu estructura de 26 columnas
    Object.keys(statsGlobal).forEach(id => {
        const s = statsGlobal[id];
        csv += `"${id},${s.nombreFull},${s.bio}","${s.baseHexVex.join(',')}","${s.f_base.join(',')}","0","0","0","0","0","0","","","","${[s.vida.rojaActual, s.vida.rojaMaxBase, s.vida.azul, s.vida.oro].join(',')}","0","0","0","0","0","0","0","0","0","0","0"\n`;
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    link.download = "HEX_PERSONAJES.csv"; link.click();
}
