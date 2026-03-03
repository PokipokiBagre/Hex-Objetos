import { statsGlobal } from './stats-state.js';

// Fórmula: Base 10 + suelo((PSI + ESP + ENE + MAN) / 4)
export function calcularVidaRojaMax(stats) {
    const sum = stats.afinidades.psiquica + stats.afinidades.espiritual + 
                stats.afinidades.energetica + stats.afinidades.mando;
    return 10 + Math.floor(sum / 4);
}

// Fórmula: VEX Base + redondeo(Oscura * 75, 50)
function redondearA(valor, multiplo) {
    return Math.round(valor / multiplo) * multiplo;
}
export function calcularVexMax(vexBase, oscura) {
    return vexBase + redondearA(oscura * 75, 50);
}

// Genera un CSV con 19 columnas (A-S) para ser compatible con la hoja original
export function generarCSVExportacion() {
    let csv = "\uFEFFPersonaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,Corazones Rojo,Corazones Rojos Max,Corazones Azules,Guarda Dorada,Daño Rojo,Daño Azul,Eliminacion Dorada,Hechizo1,Hechizo2,Hechizo3\n";
    
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        const af = p.afinidades;
        // Las últimas 3 columnas de hechizos se envían vacías para no romper el Excel maestro
        csv += `"${nombre}",${p.hex},${p.vex},${af.fisica},${af.energetica},${af.espiritual},${af.mando},${af.psiquica},${af.oscura},${p.vidaRojaActual},${p.vidaRojaMax},${p.vidaAzul},${p.guardaDorada},${p.danoRojo},${p.danoAzul},${p.elimDorada},,,\n`;
    });
    return csv;
}

export function descargarArchivoCSV(contenido, nombreArchivo) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }));
    link.download = nombreArchivo; 
    link.click();
}
