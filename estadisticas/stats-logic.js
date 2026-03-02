import { statsGlobal } from './stats-state.js';

export function calcular(id) {
    const s = statsGlobal[id]; if(!s) return null;

    const bAf = (t) => s.spAf.filter(a => a.toLowerCase().includes(t.toLowerCase())).length;
    const fF = {
        fi: s.af.fi + bAf('Física'), en: s.af.en + bAf('Energética'),
        es: s.af.es + bAf('Espiritual'), ma: s.af.ma + bAf('Mando'),
        ps: s.af.ps + bAf('Psíquica'), os: s.af.os + bAf('Oscura')
    };

    const bR = Math.floor(fF.ps / 2); // +1 Roja cada 2 Psi
    const bA = Math.floor((fF.en + fF.es + fF.ps + fF.ma) / 4); // +1 Azul cada 4 Mágicas
    const bV = Math.round((fF.os * 75) / 50) * 50;

    // Escala círculos (2000 Hex = 120px)
    const sHX = Math.min(Math.max((s.hx / 2000) * 120, 50), 200);
    const sVX = Math.min(Math.max(((s.vx + bV) / 2000) * 120, 50), 200);

    return {
        r: s.vi.r, rM: s.vi.rM + bR, a: s.vi.a + bA, g: s.vi.g,
        hx: s.hx, vxM: s.vx + bV, vxA: s.vx,
        af: fF, sp: s.sp, sHX, sVX
    };
}
