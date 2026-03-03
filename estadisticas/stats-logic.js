import { statsGlobal } from './stats-state.js';

export function calcularVidaRojaMax(p) {
    const base = p.vidaRojaMax + (p.buffs?.vidaRojaMaxExtra || 0);
    // Delta de Vida Roja: Cada 2 de Física extra = 1 Corazón Rojo
    const deltaRed = Math.floor((p.afinidades.fisica + (p.buffs?.fisica || 0)) / 2) - Math.floor(p.afinidades.fisica / 2);
    return base + deltaRed;
}

export function calcularVidaAzulMax(p) {
    const baseS = p.afinidades.espiritual + p.afinidades.energetica + p.afinidades.psiquica + p.afinidades.mando;
    const buffS = baseS + (p.buffs?.espiritual||0) + (p.buffs?.energetica||0) + (p.buffs?.psiquica||0) + (p.buffs?.mando||0);
    // Delta de Vida Azul: Cada 4 puntos místicos combinados = 1 Corazón Azul
    const deltaBlue = Math.floor(buffS / 4) - Math.floor(baseS / 4);
    
    const baseFinal = p.baseVidaAzul !== undefined ? p.baseVidaAzul : p.vidaAzul;
    return baseFinal + (p.buffs?.vidaAzulExtra || 0) + deltaBlue;
}

export function calcularVexMax(p) {
    if (p.isNPC) return p.vex;
    const oscTotal = p.afinidades.oscura + (p.buffs?.oscura || 0);
    return Math.round((oscTotal * 75) / 50) * 50;
}

export function generarCSVExportacion() {
    let csv = "\uFEFFPersonaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,Corazones Rojo,Corazones Rojos Max,Corazones Azules,Guarda Dorada,Daño Rojo,Daño Azul,Eliminacion Dorada,Hechizo1,Hechizo2,Hechizo3\n";
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        const af = p.afinidades;
        const b = p.buffs;
        
        const expVex = p.isPlayer ? 0 : p.vex;
        const expFis = af.fisica + b.fisica; const expEne = af.energetica + b.energetica;
        const expEsp = af.espiritual + b.espiritual; const expMan = af.mando + b.mando;
        const expPsi = af.psiquica + b.psiquica; const expOsc = af.oscura + b.oscura;
        
        const expVRMax = p.vidaRojaMax + b.vidaRojaMaxExtra;
        const expVA = p.baseVidaAzul + b.vidaAzulExtra;
        const expGD = p.baseGuardaDorada + b.guardaDoradaExtra;
        const expDR = p.danoRojo + b.danoRojo; const expDA = p.danoAzul + b.danoAzul; const expED = p.elimDorada + b.elimDorada;

        csv += `"${nombre}",${p.hex},${expVex},${expFis},${expEne},${expEsp},${expMan},${expPsi},${expOsc},${p.vidaRojaActual},${expVRMax},${expVA},${expGD},${expDR},${expDA},${expED},,,\n`;
    });
    return csv;
}

export function descargarArchivoCSV(contenido, nombreArchivo) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }));
    link.download = nombreArchivo; link.click();
}

