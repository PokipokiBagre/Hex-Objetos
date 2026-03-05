import { statsGlobal, listaEstados } from './stats-state.js';

export function calcularVidaRojaMax(p) {
    if (!p) return 0;
    const base = p.vidaRojaMax || 10;
    const hechizos = p.hechizos?.vidaRojaMaxExtra || 0;
    const efectos = p.hechizosEfecto?.vidaRojaMaxExtra || 0;
    const buffs = p.buffs?.vidaRojaMaxExtra || 0;
    
    return base + hechizos + efectos + buffs;
}

export function calcularVexMax(p) {
    if (!p) return 0;
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
    // Cabecera idéntica a la que espera tu lector
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

        // Formato compuesto que lee tu parseador: "2200_1"
        const hexCompound = `${p.hex || 0}_${p.asistencia || 1}`;
        const identityStr = `${p.isPlayer ? 1 : 0}_${p.isActive ? 1 : 0}`;

        const row = [
            nombre,
            hexCompound, // Columna 1: Hex y Asistencia
            p.vex || 0,  // Columna 2: Vex
            fStr(af.fisica, hz.fisica, he.fisica, bf.fisica), // Columna 3
            fStr(af.energetica, hz.energetica, he.energetica, bf.energetica), // Columna 4
            fStr(af.espiritual, hz.espiritual, he.espiritual, bf.espiritual), // Columna 5
            fStr(af.mando, hz.mando, he.mando, bf.mando), // Columna 6
            fStr(af.psiquica, hz.psiquica, he.psiquica, bf.psiquica), // Columna 7
            fStr(af.oscura, hz.oscura, he.oscura, bf.oscura), // Columna 8
            p.vidaRojaActual || 0, // Columna 9
            fStr(p.vidaRojaMax, hz.vidaRojaMaxExtra, he.vidaRojaMaxExtra, bf.vidaRojaMaxExtra), // Col 10
            fStr(p.baseVidaAzul !== undefined ? p.baseVidaAzul : (p.vidaAzul || 0), hz.vidaAzulExtra, he.vidaAzulExtra, bf.vidaAzulExtra), // Col 11
            fStr(p.baseGuardaDorada !== undefined ? p.baseGuardaDorada : (p.guardaDorada || 0), hz.guardaDoradaExtra, he.guardaDoradaExtra, bf.guardaDoradaExtra), // Col 12
            fStr(p.danoRojo, hz.danoRojo, he.danoRojo, bf.danoRojo), // Col 13
            fStr(p.danoAzul, hz.danoAzul, he.danoAzul, bf.danoAzul), // Col 14
            fStr(p.elimDorada, hz.elimDorada, he.elimDorada, bf.elimDorada), // Col 15
            estadoStr, // Col 16
            identityStr, // Col 17
            p.iconoOverride || "" // Col 18
        ];

        const rowStr = row.map((v, i) => {
            // No ponemos comillas a Nombre, Vex ni Vida Actual
            if (i === 0 || i === 2 || i === 9) return v; 
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
