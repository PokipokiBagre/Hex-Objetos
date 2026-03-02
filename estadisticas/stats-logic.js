import { statsGlobal } from './stats-state.js';

export function calcular(id) {
    const s = statsGlobal[id];
    if (!s) return null;

    // +1 Afin por cada hechizo de ese tipo aprendido
    const getBonusAfin = (tipo) => {
        if (!s.spAf) return 0;
        return s.spAf.filter(a => a.toLowerCase().includes(tipo.toLowerCase())).length;
    };

    const fF = {
        fi: (s.af.fi || 0) + getBonusAfin('Física'),
        en: (s.af.en || 0) + getBonusAfin('Energética'),
        es: (s.af.es || 0) + getBonusAfin('Espiritual'),
        ma: (s.af.ma || 0) + getBonusAfin('Mando'),
        ps: (s.af.ps || 0) + getBonusAfin('Psíquica'),
        os: (s.af.os || 0) + getBonusAfin('Oscura')
    };

    // Bonos RAD
    const bR = Math.floor(fF.ps / 2); // +1 Roja cada 2 Psi
    const bA = Math.floor((fF.en + fF.es + fF.ps + fF.ma) / 4); // +1 Azul cada 4 Mágicas
    const bV = Math.round(((fF.os || 0) * 75) / 50) * 50;

    // Escala círculos (Base 2000 = 120px)
    const sHX = Math.min(Math.max(((s.hx || 0) / 2000) * 120, 55), 200);
    const sVX = Math.min(Math.max((((s.vx || 0) + bV) / 2000) * 120, 55), 200);

    return {
        r: s.vi.r || 0,
        rM: (s.vi.rM || 0) + bR,
        a: (s.vi.a || 0) + bA,
        g: s.vi.g || 0,
        hx: s.hx || 0,
        vxM: (s.vx || 0) + bV,
        vxA: s.vx || 0,
        af: fF,
        sp: s.spNom || [],
        sHX, sVX
    };
}
