import { statsGlobal, estadoUI, guardar } from './stats-state.js';

export async function cargarStatsDesdeCSV() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZD7f7YtuNnIH1P_KWABhRFDos3GnX4dkkUUE0zpRgNiKPvtbX2kOx4N-CGi0Rc4FPKYYZxXbeJFR/pub?output=csv&cachebust=" + Date.now();
    
    const objCache = localStorage.getItem('hex_obj_v4');
    if(objCache) {
        const d = JSON.parse(objCache);
        estadoUI.principales = Object.keys(d.inv || {}).filter(k => Object.values(d.inv[k]).some(v => v > 0));
    }

    try {
        const res = await fetch(url);
        const text = await res.text();
        const filas = text.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/).map(c => c.replace(/^\"|\"$/g, '').trim()));

        filas.slice(1).forEach(f => {
            const id = f[0]; if (!id) return;

            statsGlobal[id] = {
                hex: parseInt(f[1]) || 0,
                vex: parseInt(f[2]) || 0,
                afin: { fis: parseInt(f[3])||0, ene: parseInt(f[4])||0, esp: parseInt(f[5])||0, man: parseInt(f[6])||0, psi: parseInt(f[7])||0, osc: parseInt(f[8])||0 },
                vida: { roja: parseInt(f[9])||0, rojaMax: parseInt(f[10])||10, azul: parseInt(f[11])||0, oro: parseInt(f[12])||0 },
                extra: { dR: f[13], dA: f[14], eO: f[15] },
                spells: {
                    afin: f[16] ? f[16].split(',').map(s => s.trim()) : [],
                    nom: f[17] ? f[17].split(',').map(s => s.trim()) : [],
                    hex: f[18] ? f[18].split(',').map(s => s.trim()) : []
                }
            };
        });
        guardar();
    } catch (e) { console.error("Error cargando personajes:", e); }
}
