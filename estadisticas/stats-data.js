import { statsGlobal, guardar } from './stats-state.js';

export async function cargarStatsDesdeCSV() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZD7f7YtuNnIH1P_KWABhRFDos3GnX4dkkUUE0zpRgNiKPvtbX2kOx4N-CGi0Rc4FPKYYZxXbeJFR/pub?output=csv&cachebust=" + Date.now();
    try {
        const res = await fetch(url);
        const text = await res.text();
        // Regex para manejar comas dentro de comillas (Hechizos)
        const filas = text.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));

        for (let k in statsGlobal) delete statsGlobal[k];

        filas.slice(1).forEach(f => {
            const id = f[0]; if (!id) return;
            statsGlobal[id] = {
                hx: parseInt(f[1])||0, vx: parseInt(f[2])||0,
                fi: parseInt(f[3])||0, en: parseInt(f[4])||0, es: parseInt(f[5])||0, ma: parseInt(f[6])||0, ps: parseInt(f[7])||0, os: parseInt(f[8])||0,
                r: parseInt(f[9])||0, rm: parseInt(f[10])||10, az: parseInt(f[11])||0, gd: parseInt(f[12])||0,
                dr: f[13]||"0", da: f[14]||"0", eo: f[15]||"0",
                hechizos: {
                    afin: f[16] ? f[16].split(',') : [],
                    noms: f[17] ? f[17].split(',') : [],
                    cost: f[18] ? f[18].split(',') : []
                }
            };
        });
        guardar();
    } catch (e) { console.error("Error al importar Linda:", e); }
}
