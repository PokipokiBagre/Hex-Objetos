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
export function generarCSVExportacion() {
    let csv = "\uFEFFNombre,EsJugador,Activo,HEX,Asistencia,VEX,VidaRojaActual,VidaRojaMax,VidaAzul,GuardaDorada,DanoRojo,DanoAzul,ElimDorada,AfinFisica,AfinEnergetica,AfinEspiritual,AfinMando,AfinPsiquica,AfinOscura";
    
    // Añadimos las cabeceras dinámicas de los estados alterados
    listaEstados.forEach(e => {
        csv += `,Est_${e.id}`;
    });
    csv += "\n";

    Object.keys(statsGlobal).sort().forEach(nombre => {
        const p = statsGlobal[nombre];
        
        let row = [
            nombre,
            p.isPlayer ? "SI" : "NO",
            p.isActive ? "SI" : "NO",
            p.hex || 0,
            p.asistencia || 1,
            p.vex || 0,
            p.vidaRojaActual || 0,
            p.vidaRojaMax || 0,
            p.baseVidaAzul !== undefined ? p.baseVidaAzul : (p.vidaAzul || 0),
            p.baseGuardaDorada !== undefined ? p.baseGuardaDorada : (p.guardaDorada || 0),
            p.danoRojo || 0,
            p.danoAzul || 0,
            p.elimDorada || 0,
            p.afinidades?.fisica || 0,
            p.afinidades?.energetica || 0,
            p.afinidades?.espiritual || 0,
            p.afinidades?.mando || 0,
            p.afinidades?.psiquica || 0,
            p.afinidades?.oscura || 0
        ];

        let rowStr = row.map(v => `"${v}"`).join(",");

        // Añadimos los valores de los estados de cada personaje
        listaEstados.forEach(e => {
            let val = p.estados && p.estados[e.id] !== undefined ? p.estados[e.id] : "";
            if (e.tipo === 'booleano') {
                val = val ? "SI" : "NO";
            }
            rowStr += `,"${val}"`;
        });

        csv += rowStr + "\n";
    });

    return csv;
}

// Transforma el texto CSV en un archivo descargable para el navegador
export function descargarArchivoCSV(contenido, nombreArchivo) {
    const link = document.createElement('a');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
}
