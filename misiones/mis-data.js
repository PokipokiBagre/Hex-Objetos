import { misGlobal, jugadoresActivos, estadoUI } from './mis-state.js';

// --- REEMPLAZA ESTOS LINKS POR LOS TUYOS ---
const CSV_MISIONES = 'https://script.google.com/macros/s/AKfycbyDBdYRAVyt1ZxgjXu7_MzLCXothXR_mtocQfctwA8vnSa8Qm_GGfsquq2jAAiyciUe/exec'; 
const CSV_STATS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv';
const API_MISIONES = 'https://script.google.com/macros/s/AKfycbyDBdYRAVyt1ZxgjXu7_MzLCXothXR_mtocQfctwA8vnSa8Qm_GGfsquq2jAAiyciUe/exec'; 

export async function cargarDatos() {
    try {
        const [resMis, resStats] = await Promise.all([
            fetch(CSV_MISIONES + (CSV_MISIONES.includes('?')?'&':'?') + 'cb=' + new Date().getTime()),
            fetch(CSV_STATS + '&cb=' + new Date().getTime())
        ]);
        
        parsearStats(await resStats.text());
        parsearMisiones(await resMis.text());
    } catch (e) {
        console.error("Error cargando CSVs:", e);
    }
}

function parsearStats(texto) {
    const filas = texto.split(/\r?\n/);
    jugadoresActivos.length = 0;
    filas.slice(1).forEach(f => {
        const c = f.split(',');
        if (c.length > 17) {
            const nombre = c[0].replace(/^"|"$/g, '').trim();
            const idenParts = (c[17] || '0_1').replace(/^"|"$/g, '').split('_');
            const isPlayer = idenParts[0] === '1';
            const isActive = idenParts[1] === '1';
            // Extraer override icon si existe, si no usar el nombre
            const icon = c[18] ? c[18].replace(/^"|"$/g, '').trim() : nombre;
            
            if (isPlayer && isActive) {
                jugadoresActivos.push({ nombre, icon });
            }
        }
    });
}

function parsearMisiones(texto) {
    const filas = texto.split(/\r?\n/).map(l => {
        let matches = l.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
        if(!matches) return []; return matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());
    });

    misGlobal.length = 0; // Vaciamos

    filas.slice(1).forEach((f, index) => {
        if(!f[0]) return;
        misGlobal.push({
            id: f[0], // ID Único
            titulo: f[1] || 'Sin Título',
            tipo: f[2] || 'Personalizada', // Grande, Normal, Personalizada, OP
            clase: f[3] || '1',
            desc: f[4] || '',
            autor: f[5] || 'Sistema',
            estado: parseInt(f[6]) || 0, // 0:Inactiva, 1:Pendiente, 2:Proceso, 3:Finalizada
            jugadores: f[7] ? f[7].split(',').map(j=>j.trim()).filter(j=>j) : [],
            cupos: parseInt(f[8]) || 0, // Si es 0, es infinito
            notaOP: f[9] || '',
            orden: index // Guardamos el orden original del Excel
        });
    });
}

export async function sincronizarBD() {
    try {
        const payload = { accion: 'sincronizar_misiones', misiones: estadoUI.colaCambios.misiones };
        const res = await fetch(API_MISIONES, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        const data = await res.json();
        return data.status === 'success';
    } catch(e) {
        console.error(e);
        return false;
    }
}
