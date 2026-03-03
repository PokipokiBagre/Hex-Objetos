import { statsGlobal } from './stats-state.js';

export function calcularVidaRojaMax(p) {
    const base = p.vidaRojaMax + (p.buffs?.vidaRojaMaxExtra || 0);
    const deltaRed = Math.floor((p.afinidades.fisica + (p.buffs?.fisica || 0)) / 2) - Math.floor(p.afinidades.fisica / 2);
    return base + deltaRed;
}

export function calcularVidaAzulMax(p) {
    const baseS = p.afinidades.espiritual + p.afinidades.energetica + p.afinidades.psiquica + p.afinidades.mando;
    const buffS = baseS + (p.buffs?.espiritual||0) + (p.buffs?.energetica||0) + (p.buffs?.psiquica||0) + (p.buffs?.mando||0);
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
    let csv = "\uFEFFPersonaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,Corazones Rojo,Corazones Rojos Max,Corazones Azules,Guarda Dorada,Daño Rojo,Daño Azul,Eliminacion Dorada,Estado\n";
    
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        const af = p.afinidades;
        const b = p.buffs;
        const st = p.estados || {};
        
        const expVex = p.isPlayer ? 0 : p.vex;
        const expFis = af.fisica + b.fisica; const expEne = af.energetica + b.energetica;
        const expEsp = af.espiritual + b.espiritual; const expMan = af.mando + b.mando;
        const expPsi = af.psiquica + b.psiquica; const expOsc = af.oscura + b.oscura;
        
        const expVRMax = p.vidaRojaMax + b.vidaRojaMaxExtra;
        const expVA = (p.baseVidaAzul !== undefined ? p.baseVidaAzul : p.vidaAzul) + b.vidaAzulExtra;
        const expGD = (p.baseGuardaDorada !== undefined ? p.baseGuardaDorada : p.guardaDorada) + b.guardaDoradaExtra;
        const expDR = p.danoRojo + b.danoRojo; const expDA = p.danoAzul + b.danoAzul; const expED = p.elimDorada + b.elimDorada;

        // Empaquetador de Estados. Generará algo como "3-7-0-1-0-1-0-0-0-0-0-0-0"
        const arrEstados = [
            st.veneno || 0, st.radiacion || 0, st.maldito ? 1 : 0, st.incapacitado ? 1 : 0,
            st.debilitado ? 1 : 0, st.angustia ? 1 : 0, st.petrificacion ? 1 : 0,
            st.secuestrado ? 1 : 0, st.huesos ? 1 : 0, st.comestible ? 1 : 0,
            st.cifrado ? 1 : 0, st.inversion ? 1 : 0, st.verde ? 1 : 0
        ];
        const expEstado = arrEstados.join('-');

        csv += `"${nombre}",${p.hex},${expVex},${expFis},${expEne},${expEsp},${expMan},${expPsi},${expOsc},${p.vidaRojaActual},${expVRMax},${expVA},${expGD},${expDR},${expDA},${expED},"${expEstado}"\n`;
    });
    return csv;
}

export function descargarArchivoCSV(contenido, nombreArchivo) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }));
    link.download = nombreArchivo; link.click();
}

