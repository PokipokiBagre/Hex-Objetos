import { statsGlobal } from './stats-state.js';

export function descargarEstadoCSV() {
    let csv = "\uFEFFPersonaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,CorRojos,CorRojosMax,CorAzules,GuardaOro,DanRojo,DanAzul,ElimOro,H_Afin,H_Nom,H_Hex\n";
    Object.keys(statsGlobal).sort().forEach(id => {
        const p = statsGlobal[id];
        // Exporta 19 columnas (A-S). Las últimas 3 (hechizos) van vacías para evitar bugs.
        csv += `"${p.id}",${p.hex},${p.vex},${p.fi},${p.en},${p.es},${p.ma},${p.ps},${p.os},${p.r},${p.rm},${p.az},${p.gd},${p.dr},${p.da},${p.eo},"","",""\n`;
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `HEX_ESTADO_PERSONAJES.csv`; link.click();
}
