import { statsGlobal, estadoUI, guardar } from './stats-state.js';

export async function cargarStatsDesdeCSV() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZD7f7YtuNnIH1P_KWABhRFDos3GnX4dkkUUE0zpRgNiKPvtbX2kOx4N-CGi0Rc4FPKYYZxXbeJFR/pub?output=csv&cachebust=" + Date.now();
    
    // Detectar prioritarios de inventario
    const objData = localStorage.getItem('hex_obj_v4');
    if(objData) {
        const d = JSON.parse(objData);
        estadoUI.principales = Object.keys(d.inv || {}).filter(k => Object.values(d.inv[k]).some(v => v > 0));
    }

    try {
        const res = await fetch(url);
        const text = await res.text();
        const filas = text.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/).map(c => c.replace(/^\"|\"$/g, '').trim()));

        filas.slice(1).forEach(f => {
            const id = f[0]; if (!id) return;

            // Parseo de Hechizos (Q, R, S)
            const listAfin = f[16] ? f[16].split(',').map(s => s.trim()) : [];
            const listNom = f[17] ? f[17].split(',').map(s => s.trim()) : [];
            const listHex = f[18] ? f[18].split(',').map(s => s.trim()) : [];

            const spells = listNom.map((n, i) => ({
                nom: n, afin: listAfin[i] || '?', hex: listHex[i] || '0'
            })).filter(s => s.nom !== "");

            statsGlobal[id] = {
                hex: parseInt(f[1]) || 0,
                vex: parseInt(f[2]) || 0,
                afin: { fis: parseInt(f[3])||0, ene: parseInt(f[4])||0, esp: parseInt(f[5])||0, man: parseInt(f[6])||0, psi: parseInt(f[7])||0, osc: parseInt(f[8])||0 },
                vida: { actual: parseInt(f[9])||0, maxBase: parseInt(f[10])||10, azul: parseInt(f[11])||0, oro: parseInt(f[12])||0 },
                extra: { dR: f[13], dA: f[14], eO: f[15] },
                learnedSpells: spells
            };
        });
        guardar();
    } catch (e) { console.error("Error CSV:", e); }
}
