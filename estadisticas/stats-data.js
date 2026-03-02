import { statsGlobal, estadoUI, guardar } from './stats-state.js';

export async function cargarStatsDesdeCSV() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZD7f7YtuNnIH1P_KWABhRFDos3GnX4dkkUUE0zpRgNiKPvtbX2kOx4N-CGi0Rc4FPKYYZxXbeJFR/pub?output=csv&cachebust=" + Date.now();
    
    // Identificar prioritarios por inventario
    const cacheInv = localStorage.getItem('hex_obj_v4');
    if(cacheInv) {
        const d = JSON.parse(cacheInv);
        estadoUI.principales = Object.keys(d.inv || {}).filter(k => Object.values(d.inv[k]).some(v => v > 0));
    }

    try {
        const res = await fetch(url);
        const text = await res.text();
        const filas = text.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));

        const parseSet = (str, len) => {
            const arr = str ? str.split(',').map(v => v.trim()) : [];
            while(arr.length < len) arr.push("0");
            return arr;
        };

        filas.slice(1).forEach(f => {
            if (!f[0]) return;
            const dataA = f[0].split(',').map(s => s.trim());
            const id = dataA[0];
            
            statsGlobal[id] = {
                nombreFull: dataA[1] || id,
                bio: dataA[2] || "Sin datos.",
                baseHV: parseSet(f[1], 4), // Hex, AumH, Vex, AumV
                f_base: parseSet(f[2], 6), // FEEMPO
                f_modDir: parseSet(f[3], 6), f_aumPerm: parseSet(f[4], 6),
                f_disPerm: parseSet(f[5], 6), f_aumTemp: parseSet(f[6], 6),
                f_disTemp: parseSet(f[7], 6), f_aumHech: parseSet(f[8], 6),
                spells: { nom: f[10] ? f[10].split(',') : [], hex: f[11] ? f[11].split(',') : [] },
                r_base: parseSet(f[12], 4), // RojaAct, RojaMaxBase, Azul, Oro
                r_modDir: parseSet(f[13], 4), r_aumPerm: parseSet(f[15], 4), 
                r_disPerm: parseSet(f[16], 4), r_aumTemp: parseSet(f[17], 4), r_disTemp: parseSet(f[18], 4)
            };
        });
        guardar();
    } catch (e) { console.error("Error CSV:", e); }
}
