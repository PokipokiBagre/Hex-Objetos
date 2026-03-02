import { statsGlobal, guardarStats } from './stats-state.js';

export async function cargarStatsDesdeCSV() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZD7f7YtuNnIH1P_KWABhRFDos3GnX4dkkUUE0zpRgNiKPvtbX2kOx4N-CGi0Rc4FPKYYZxXbeJFR/pub?output=csv&cachebust=" + Date.now();
    try {
        const res = await fetch(url);
        const data = await res.text();
        const filas = data.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));

        filas.slice(1).forEach(f => {
            const p = f[0]; if (!p) return;
            
            // Parseo de Hechizos Aprendidos
            const afinidadesList = f[14] ? f[14].split(',').map(s => s.trim()) : [];
            const nombresList = f[15] ? f[15].split(',').map(s => s.trim()) : [];
            const hexList = f[16] ? f[16].split(',').map(s => s.trim()) : [];

            const spells = nombresList.map((nombre, i) => ({
                nombre,
                afinidad: afinidadesList[i] || '?',
                costo: hexList[i] || '0'
            })).filter(s => s.nombre !== "");

            statsGlobal[p] = {
                nombreFull: f[1],
                bio: f[2],
                hex: parseInt(f[3]) || 0,
                vex: parseInt(f[5]) || 0,
                afin: {
                    fis: parseInt(f[7]) || 0,
                    ene: parseInt(f[8]) || 0,
                    esp: parseInt(f[9]) || 0,
                    man: parseInt(f[10]) || 0,
                    psi: parseInt(f[11]) || 0,
                    osc: parseInt(f[12]) || 0
                },
                learnedSpells: spells,
                vida: {
                    roja: f[17] || "0/10",
                    azul: parseInt(f[18]) || 0,
                    oro: parseInt(f[19]) || 0
                }
            };
        });
        guardarStats();
    } catch (e) { console.error("Error cargando Stats:", e); }

}
