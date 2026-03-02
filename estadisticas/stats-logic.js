import { statsGlobal } from './stats-state.js';

export function calcularValores(id) {
    const s = statsGlobal[id]; if(!s) return null;
    const conv = (arr) => arr.map(v => parseInt(v) || 0);

    // Afinidades Finales
    const f_base = conv(s.f_base);
    const f_fin = f_base.map((b, i) => b + conv(s.f_modDir)[i] + conv(s.f_aumPerm)[i] - conv(s.f_disPerm)[i] + conv(s.f_aumTemp)[i] - conv(s.f_disTemp)[i] + conv(s.f_aumHech)[i]);

    // Bonos RAD
    const bRoja = Math.floor(f_fin[0] / 2);
    const bAzul = Math.floor((f_fin[1] + f_fin[2] + f_fin[3] + f_fin[4]) / 4);

    // Vitalidad Final (RAD)
    const r_base = conv(s.r_base);
    const r_fin = r_base.map((b, i) => {
        const perm = conv(s.r_aumPerm)[i];
        const total = b + conv(s.r_modDir)[i] + perm - conv(s.r_disPerm)[i] + conv(s.r_aumTemp)[i] - conv(s.r_disTemp[i]);
        if(i === 1) return total + bRoja; // Max Roja
        if(i === 2) return total + bAzul; // Azul
        return total;
    });

    return {
        rActual: r_fin[0], rMax: r_fin[1], azul: r_fin[2], oro: r_fin[3],
        hex: parseInt(s.baseHV[0]) + parseInt(s.baseHV[1]),
        vexMax: parseInt(s.baseHV[2]) + (f_fin[5] * 75),
        vexCur: parseInt(s.baseHV[2]),
        afin: f_fin, nombre: s.nombreFull, bio: s.bio
    };
}
