import { statsGlobal, guardar } from './stats-state.js';

export async function cargarTodoDesdeCSV() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv&cachebust=" + new Date().getTime();
    try {
        const res = await fetch(sheetURL);
        const texto = await res.text();
        procesarTextoCSV(texto);
        return true;
    } catch (e) { 
        console.error("Error cargando CSV:", e);
        return false;
    }
}

export function procesarTextoCSV(texto) {
    const filas = texto.split(/\r?\n/).map(l => {
        let matches = l.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
        if(!matches) return [];
        return matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());
    });

    for (let k in statsGlobal) delete statsGlobal[k];

    filas.slice(1).forEach(f => {
        const nombre = f[0]; 
        if (!nombre) return;
        
        const cols = Array.from({length: 16}, (_, i) => f[i] || '0');

        statsGlobal[nombre] = {
            isNPC: false, // Por defecto, los del CSV usan fórmulas
            hex: parseInt(cols[1]) || 0,
            vex: parseInt(cols[2]) || 0,
            afinidades: {
                fisica: parseInt(cols[3]) || 0, energetica: parseInt(cols[4]) || 0,
                espiritual: parseInt(cols[5]) || 0, mando: parseInt(cols[6]) || 0,
                psiquica: parseInt(cols[7]) || 0, oscura: parseInt(cols[8]) || 0
            },
            vidaRojaActual: parseInt(cols[9]) || 0, vidaRojaMax: parseInt(cols[10]) || 0,
            vidaAzul: parseInt(cols[11]) || 0, guardaDorada: parseInt(cols[12]) || 0,
            // DAÑOS AÑADIDOS
            danoRojo: parseInt(cols[13]) || 0, danoAzul: parseInt(cols[14]) || 0, elimDorada: parseInt(cols[15]) || 0,
            // BUFFS TEMPORALES
            buffs: { fisica: 0, energetica: 0, espiritual: 0, mando: 0, psiquica: 0, oscura: 0, danoRojo: 0, danoAzul: 0, elimDorada: 0, vidaRojaMaxExtra: 0 }
        };
    });
    guardar();
}
