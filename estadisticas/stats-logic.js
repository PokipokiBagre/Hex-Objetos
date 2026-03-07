import { statsGlobal, listaEstados } from './stats-state.js';

export function getMayorAfinidad(p) {
    const afis = {
        'Física': p.afinidades?.fisica || 0,
        'Energética': p.afinidades?.energetica || 0,
        'Espiritual': p.afinidades?.espiritual || 0,
        'Mando': p.afinidades?.mando || 0,
        'Psíquica': p.afinidades?.psiquica || 0,
        'Oscura': p.afinidades?.oscura || 0
    };
    let max = -1; let mayor = "Ninguna";
    for(let key in afis) { if(afis[key] > max && afis[key] > 0) { max = afis[key]; mayor = key; } }
    return mayor;
}

export function calcularVidaRojaMax(p) {
    if (!p) return 0;
    const base = p.vidaRojaMax || 10;
    const hechizos = p.hechizos?.vidaRojaMaxExtra || 0;
    const efectos = p.hechizosEfecto?.vidaRojaMaxExtra || 0;
    const buffs = p.buffs?.vidaRojaMaxExtra || 0;
    
    const fisBase = p.afinidades?.fisica || 0;
    const fisTotal = fisBase + (p.hechizos?.fisica || 0) + (p.hechizosEfecto?.fisica || 0) + (p.buffs?.fisica || 0);
    const bonusFisica = Math.floor(fisTotal / 2) - Math.floor(fisBase / 2);

    return base + hechizos + efectos + buffs + bonusFisica;
}

export function calcularVexMax(p) {
    if (!p) return 0;
    if (p.isPlayer) {
        const oscBase = p.afinidades?.oscura || 0;
        const oscSpell = p.hechizos?.oscura || 0;
        const oscEff = p.hechizosEfecto?.oscura || 0;
        const oscBuff = p.buffs?.oscura || 0;
        const totalOscura = oscBase + oscSpell + oscEff + oscBuff;
        const vexCrudo = (totalOscura * 300) / 4;
        return Math.round(vexCrudo / 50) * 50;
    }
    return p.vex || 0;
}

export function getMysticBonus(p) {
    if (!p) return 0;
    const ene = p.afinidades?.energetica || 0;
    const esp = p.afinidades?.espiritual || 0;
    const man = p.afinidades?.mando || 0;
    const psi = p.afinidades?.psiquica || 0;
    return Math.floor((ene + esp + man + psi) / 4);
}

export function generarCSVExportacion() {
    let csv = "Personaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,Corazones Rojo,Corazones Rojos Max,Corazones Azules,Guarda Dorada,Daño Rojo,Daño Azul,Eliminacion Dorada,Estado,Jugador_Activo,Copia\n";

    const fStr = (base, spells, spellEff, buff) => {
        const b = base || 0; const s = spells || 0; const se = spellEff || 0; const bf = buff || 0;
        return `${b + s + se + bf}_${b}_${s}_${se}_${bf}`;
    };

    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        const af = p.afinidades || {};
        const hz = p.hechizos || {};
        const he = p.hechizosEfecto || {};
        const bf = p.buffs || {};
        const est = p.estados || {};

        const estadoStr = listaEstados.map(e => {
            let v = est[e.id];
            if (e.tipo === 'booleano') return v ? '1' : '0';
            return v || '0';
        }).join('-');

        const hexCompound = `${p.hex || 0}_${p.asistencia || 1}`;
        const identityStr = `${p.isPlayer ? 1 : 0}_${p.isActive ? 1 : 0}`;
        const vexExport = p.isPlayer ? 0 : (p.vex || 0);

        const row = [
            nombre, hexCompound, vexExport, 
            fStr(af.fisica, hz.fisica, he.fisica, bf.fisica), 
            fStr(af.energetica, hz.energetica, he.energetica, bf.energetica), 
            fStr(af.espiritual, hz.espiritual, he.espiritual, bf.espiritual), 
            fStr(af.mando, hz.mando, he.mando, bf.mando), 
            fStr(af.psiquica, hz.psiquica, he.psiquica, bf.psiquica), 
            fStr(af.oscura, hz.oscura, he.oscura, bf.oscura), 
            p.vidaRojaActual !== undefined ? p.vidaRojaActual : 0, 
            fStr(p.vidaRojaMax, hz.vidaRojaMaxExtra, he.vidaRojaMaxExtra, bf.vidaRojaMaxExtra), 
            fStr(p.vidaAzul !== undefined ? p.vidaAzul : 0, hz.vidaAzulExtra, he.vidaAzulExtra, bf.vidaAzulExtra), 
            fStr(p.guardaDorada !== undefined ? p.guardaDorada : 0, hz.guardaDoradaExtra, he.guardaDoradaExtra, bf.guardaDoradaExtra), 
            fStr(p.danoRojo, hz.danoRojo, he.danoRojo, bf.danoRojo), 
            fStr(p.danoAzul, hz.danoAzul, he.danoAzul, bf.danoAzul), 
            fStr(p.elimDorada, hz.elimDorada, he.elimDorada, bf.elimDorada), 
            estadoStr, identityStr, p.iconoOverride || "" 
        ];

        const rowStr = row.map((v, i) => {
            if (i === 0 || i === 1 || i === 2 || i === 9) return String(v); 
            return `"${v}"`;
        }).join(",");

        csv += rowStr + "\n";
    });

    return csv;
}

export function descargarArchivoCSV(contenido, nombreArchivo) {
    const link = document.createElement('a');
    const blob = new Blob(["\uFEFF" + contenido], { type: 'text/csv;charset=utf-8;' });
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
}
