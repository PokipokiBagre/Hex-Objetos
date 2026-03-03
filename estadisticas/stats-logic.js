import { statsGlobal, listaEstados } from './stats-state.js';

export function calcularVidaRojaMax(p) {
    const basePura = (p.vidaRojaMax||0) + (p.hechizos?.vidaRojaMaxExtra||0) + (p.buffs?.vidaRojaMaxExtra||0);
    const fisTotal = (p.afinidades.fisica||0) + (p.hechizos?.fisica||0) + (p.buffs?.fisica||0);
    return basePura + Math.floor(fisTotal / 2);
}

// NUEVO: Monitorea el total de la Piscina Mística dividida entre 4
export function getMysticBonus(p) {
    const t = (p.afinidades.espiritual||0) + (p.afinidades.energetica||0) + (p.afinidades.psiquica||0) + (p.afinidades.mando||0) +
              (p.hechizos?.espiritual||0) + (p.hechizos?.energetica||0) + (p.hechizos?.psiquica||0) + (p.hechizos?.mando||0) +
              (p.buffs?.espiritual||0) + (p.buffs?.energetica||0) + (p.buffs?.psiquica||0) + (p.buffs?.mando||0);
    return Math.floor(t / 4);
}

export function calcularVexMax(p) {
    if (p.isNPC) return p.vex;
    const oscTotal = (p.afinidades.oscura||0) + (p.hechizos?.oscura||0) + (p.buffs?.oscura||0);
    return Math.round((oscTotal * 75) / 50) * 50;
}

function formatExp(base, spells, extra) {
    const b = parseInt(base) || 0; const s = parseInt(spells) || 0; const e = parseInt(extra) || 0;
    return `${b + s + e}_${b}_${s}_${e}`;
}

export function generarCSVExportacion() {
    let csv = "\uFEFFPersonaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,Corazones Rojo,Corazones Rojos Max,Corazones Azules,Guarda Dorada,Daño Rojo,Daño Azul,Eliminacion Dorada,Estado,Jugador_Activo\n";
    
    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        const af = p.afinidades; const h = p.hechizos || {}; const b = p.buffs || {};
        const st = p.estados || {};
        
        const expVex = p.isPlayer ? 0 : p.vex;
        const eFis = formatExp(af.fisica, h.fisica, b.fisica); const eEne = formatExp(af.energetica, h.energetica, b.energetica);
        const eEsp = formatExp(af.espiritual, h.espiritual, b.espiritual); const eMan = formatExp(af.mando, h.mando, b.mando);
        const ePsi = formatExp(af.psiquica, h.psiquica, b.psiquica); const eOsc = formatExp(af.oscura, h.oscura, b.oscura);
        
        const eVRMax = formatExp(p.vidaRojaMax, h.vidaRojaMaxExtra, b.vidaRojaMaxExtra);
        // Consumibles limpios (Base_Hechizos_Buffs)
        const eVA = formatExp(p.vidaAzul, h.vidaAzulExtra, b.vidaAzulExtra);
        const eGD = formatExp(p.guardaDorada, h.guardaDoradaExtra, b.guardaDoradaExtra);
        
        const eDR = formatExp(p.danoRojo, h.danoRojo, b.danoRojo); const eDA = formatExp(p.danoAzul, h.danoAzul, b.danoAzul); const eED = formatExp(p.elimDorada, h.elimDorada, b.elimDorada);

        const arrEstados = listaEstados.map(e => {
            let val = st[e.id];
            if (e.tipo === 'numero') return val || 0;
            return val ? 1 : 0;
        });

        const expJugAct = `${p.isPlayer ? '1' : '0'}_${p.isActive !== false ? '1' : '0'}`;

        csv += `"${nombre}",${p.hex},${expVex},"${eFis}","${eEne}","${eEsp}","${eMan}","${ePsi}","${eOsc}",${p.vidaRojaActual},"${eVRMax}","${eVA}","${eGD}","${eDR}","${eDA}","${eED}","${arrEstados.join('-')}","${expJugAct}"\n`;
    });
    return csv;
}

export function descargarArchivoCSV(contenido, nombreArchivo) {
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }));
    link.download = nombreArchivo; link.click();
}
