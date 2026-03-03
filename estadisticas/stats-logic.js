import { statsGlobal } from './stats-state.js';

export function calcularVidaRojaMax(p) {
    if (p.isNPC) return p.vidaRojaMax + (p.buffs?.vidaRojaMaxExtra || 0); 
    const ps = p.afinidades.psiquica + (p.buffs?.psiquica || 0);
    const es = p.afinidades.espiritual + (p.buffs?.espiritual || 0);
    const en = p.afinidades.energetica + (p.buffs?.energetica || 0);
    const ma = p.afinidades.mando + (p.buffs?.mando || 0);
    return 10 + Math.floor((ps + es + en + ma) / 4) + (p.buffs?.vidaRojaMaxExtra || 0);
}

export function calcularVexMax(p) {
    if (p.isNPC) return p.vex; // Los NPCs manuales conservan su VEX escrito a mano
    // Corrección: El VEX depende ÚNICAMENTE de la afinidad Oscura total.
    const oscTotal = p.afinidades.oscura + (p.buffs?.oscura || 0);
    return Math.round((oscTotal * 75) / 50) * 50;
}

export function generarCSVExportacion() {
    let csv = "\uFEFFPersonaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,Corazones Rojo,Corazones Rojos Max,Corazones Azules,Guarda Dorada,Daño Rojo,Daño Azul,Eliminacion Dorada,Hechizo1,Hechizo2,Hechizo3\n";
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        const af = p.afinidades;
        csv += `"${nombre}",${p.hex},${p.vex},${af.fisica},${af.energetica},${af.espiritual},${af.mando},${af.psiquica},${af.oscura},${p.vidaRojaActual},${p.vidaRojaMax},${p.vidaAzul},${p.guardaDorada},${p.danoRojo},${p.danoAzul},${p.elimDorada},,,\n`;
    });
    return csv;
}

export function descargarArchivoCSV(contenido, nombreArchivo) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }));
    link.download = nombreArchivo; link.click();
}

