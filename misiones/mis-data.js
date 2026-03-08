import { misGlobal, jugadoresActivos, estadoUI } from './mis-state.js';

// --- TUS ENLACES REALES Y DEFINITIVOS ---
const CSV_MISIONES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_7MnwczeHhMCuQ_YInOHBvVUFv7ZSp_bsvFqkTmC_GvSdINkoskGPk__u9dq9XHTeVo4AMAMQl7v/pub?output=csv'; 
const CSV_STATS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv';
const API_MISIONES = 'https://script.google.com/macros/s/AKfycbyDBdYRAVyt1ZxgjXu7_MzLCXothXR_mtocQfctwA8vnSa8Qm_GGfsquq2jAAiyciUe/exec'; 

export async function cargarDatos() {
    try {
        const [resMis, resStats] = await Promise.all([
            fetch(CSV_MISIONES + '&cb=' + new Date().getTime()),
            fetch(CSV_STATS + '&cb=' + new Date().getTime())
        ]);
        
        parsearStats(await resStats.text());
        parsearMisiones(await resMis.text());
    } catch (e) {
        console.error("Error cargando CSVs:", e);
    }
}

// Lector de CSV blindado: Respeta las comas que están dentro de textos largos (descripciones)
function csvSplit(row) {
    let result = []; 
    let cur = ''; 
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        let char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cur); 
            cur = ''; 
        } else {
            cur += char;
        }
    }
    result.push(cur);
    return result;
}

function parsearStats(texto) {
    const filas = texto.split(/\r?\n/);
    jugadoresActivos.length = 0;
    
    filas.slice(1).forEach(f => {
        if(!f.trim()) return;
        const c = csvSplit(f);
        if (c.length > 17) {
            const nombre = c[0].trim();
            const idenParts = (c[17] || '0_1').split('_');
            const isPlayer = idenParts[0] === '1';
            const isActive = idenParts[1] === '1';
            const icon = c[18] ? c[18].trim() : nombre;
            
            if (isPlayer && isActive) {
                jugadoresActivos.push({ nombre, icon });
            }
        }
    });
}

function parsearMisiones(texto) {
    const filas = texto.split(/\r?\n/);
    misGlobal.length = 0; 

    filas.slice(1).forEach((f, index) => {
        if(!f.trim()) return;
        const c = csvSplit(f);
        if(!c[0]) return;
        
        misGlobal.push({
            id: c[0].trim(), 
            titulo: c[1] ? c[1].trim() : 'Sin Título',
            tipo: c[2] ? c[2].trim() : 'Personalizada', // Grande, Normal, Personalizada, OP
            clase: c[3] ? c[3].trim() : '1',
            desc: c[4] ? c[4].trim() : '',
            autor: c[5] ? c[5].trim() : 'Sistema',
            estado: parseInt(c[6]) || 0, // 0:Inactiva, 1:Pendiente, 2:Proceso, 3:Finalizada
            jugadores: c[7] ? c[7].split(',').map(j=>j.trim()).filter(j=>j) : [],
            cupos: parseInt(c[8]) || 0, // Si es 0, es infinito
            notaOP: c[9] ? c[9].trim() : '',
            orden: index 
        });
    });
}

export async function sincronizarBD() {
    try {
        const payload = { accion: 'sincronizar_misiones', misiones: estadoUI.colaCambios.misiones };
        const res = await fetch(API_MISIONES, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
            body: JSON.stringify(payload) 
        });
        const data = await res.json();
        return data.status === 'success';
    } catch(e) {
        console.error("Error en sincronización:", e);
        return false;
    }
}
