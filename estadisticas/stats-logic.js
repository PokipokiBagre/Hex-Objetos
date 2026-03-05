import { statsGlobal, listaEstados } from './stats-state.js';

// Calcula la suma de la Vida Roja Base + los Extras Temporales o de Hechizos
export function calcularVidaRojaMax(p) {
    if (!p) return 0;
    const base = p.vidaRojaMax || 10;
    const hechizos = p.hechizos?.vidaRojaMaxExtra || 0;
    const efectos = p.hechizosEfecto?.vidaRojaMaxExtra || 0;
    const buffs = p.buffs?.vidaRojaMaxExtra || 0;
    
    return base + hechizos + efectos + buffs;
}

// Devuelve el VEX Máximo actual
export function calcularVexMax(p) {
    if (!p) return 0;
    return p.vex || 0;
}

// Formula de los Corazones Azules Místicos: (Ene + Esp + Man + Psi) / 4
export function getMysticBonus(p) {
    if (!p) return 0;
    const ene = p.afinidades?.energetica || 0;
    const esp = p.afinidades?.espiritual || 0;
    const man = p.afinidades?.mando || 0;
    const psi = p.afinidades?.psiquica || 0;
    
    return Math.floor((ene + esp + man + psi) / 4);
}

// Empaqueta toda la información de la base de datos local a un texto CSV
// REPARADO: Ahora exporta en el formato "Total_Base_Spells_Efecto_Buff"
export function generarCSVExportacion() {
    let csv = "Personaje,Hex,Vex,Fisica,Energetica,Espiritual,Mando,Psiquica,Oscura,Corazones Rojo,Corazones Rojos Max,Corazones Azules,Guarda Dorada,Daño Rojo,Daño Azul,Eliminacion Dorada,Estado,Jugador_Activo,Copia\n";

    // Función de ayuda para empaquetar "Total_Base_Conteo_Efecto_Buff"
    const fStr = (base, spells, spellEff, buff) => {
        const b = base || 0;
        const s = spells || 0;
        const se = spellEff || 0;
        const bf = buff || 0;
        const total = b + s + se + bf;
        return `${total}_${b}_${s}_${se}_${bf}`;
    };

    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        
        // Aseguramos estructuras
        const af = p.afinidades || {};
        const hz = p.hechizos || {};
        const he = p.hechizosEfecto || {};
        const bf = p.buffs || {};
        const est = p.estados || {};

        // Convertimos los estados de vuelta al formato "val1-val2-val3..."
        const estadoStr = listaEstados.map(e => {
            let v = est[e.id];
            if (e.tipo === 'booleano') return v ? '1' : '0';
            return v || '0';
        }).join('-');

        const row = [
            nombre,
            p.hex || 0,
            p.vex || 0,
            fStr(af.fisica, hz.fisica, he.fisica, bf.fisica),
            fStr(af.energetica, hz.energetica, he.energetica, bf.energetica),
            fStr(af.espiritual, hz.espiritual, he.espiritual, bf.espiritual),
            fStr(af.mando, hz.mando, he.mando, bf.mando),
            fStr(af.psiquica, hz.psiquica, he.psiquica, bf.psiquica),
            fStr(af.oscura, hz.oscura, he.oscura, bf.oscura),
            p.vidaRojaActual || 0,
            fStr(p.vidaRojaMax, hz.vidaRojaMaxExtra, he.vidaRojaMaxExtra, bf.vidaRojaMaxExtra),
            fStr(p.baseVidaAzul !== undefined ? p.baseVidaAzul : (p.vidaAzul || 0), hz.vidaAzulExtra, he.vidaAzulExtra, bf.vidaAzulExtra),
            fStr(p.baseGuardaDorada !== undefined ? p.baseGuardaDorada : (p.guardaDorada || 0), hz.guardaDoradaExtra, he.guardaDoradaExtra, bf.guardaDoradaExtra),
            fStr(p.danoRojo, hz.danoRojo, he.danoRojo, bf.danoRojo),
            fStr(p.danoAzul, hz.danoAzul, he.danoAzul, bf.danoAzul),
            fStr(p.elimDorada, hz.elimDorada, he.elimDorada, bf.elimDorada),
            estadoStr,
            `${p.isPlayer ? 1 : 0}_${p.isActive ? 1 : 0}`,
            p.iconoOverride || ""
        ];

        // Formateo de comillas para coincidir con tu input
        const rowStr = row.map((v, i) => {
            // No ponemos comillas al Nombre (i=0), Hex (i=1), Vex (i=2), ni Vida Actual (i=9)
            if (i === 0 || i === 1 || i === 2 || i === 9) return v;
            return `"${v}"`;
        }).join(",");

        csv += rowStr + "\n";
    });

    return csv;
}

// Transforma el texto CSV en un archivo descargable para el navegador
export function descargarArchivoCSV(contenido, nombreArchivo) {
    const link = document.createElement('a');
    // Mantenemos el \uFEFF aquí para que Excel lea los tildes sin corromper tu lector original
    const blob = new Blob(["\uFEFF" + contenido], { type: 'text/csv;charset=utf-8;' });
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
}
