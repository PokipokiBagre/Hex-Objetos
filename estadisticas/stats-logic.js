import { statsGlobal } from './stats-state.js';

export function calcularValores(id) {
    const s = statsGlobal[id]; if(!s) return null;
    const toN = (v) => parseInt(v) || 0;

    // Bonos RAD directos: +1 Roja cada 2 Psíquica | +1 Azul cada 4 de (Ene, Esp, Psi, Man)
    const bRoja = Math.floor(toN(s.ps) / 2);
    const bAzul = Math.floor((toN(s.en) + toN(s.es) + toN(s.ps) + toN(s.ma)) / 4);

    return {
        hx: s.hex, r: toN(s.r), rm: toN(s.rm) + bRoja, az: toN(s.az) + bAzul, 
        vxA: s.vex, afin: s, nombre: id
    };
}

export function descargarCSV() {
    let csv = "\uFEFFPersonaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,R,RM,A,G,DR,DA,EO\n";
    Object.keys(statsGlobal).sort().forEach(id => {
        const p = statsGlobal[id];
        csv += `"${p.id}",${p.hex},${p.vex},${p.fi},${p.en},${p.es},${p.ma},${p.ps},${p.os},${p.r},${p.rm},${p.az},${p.go},${p.dr},${p.da},${p.eo}\n`;
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    link.download = "HEX_ESTADO_TOTAL.csv"; link.click();
}
