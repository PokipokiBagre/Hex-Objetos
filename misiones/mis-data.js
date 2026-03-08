import { misGlobal, jugadoresActivos, estadoUI } from './mis-state.js';

// --- ENLACES DEFINITIVOS ---
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

function parsearStats(texto) {
    const filas = texto.split(/\r?\n/);
    jugadoresActivos.length = 0;
    
    filas.slice(1).forEach(f => {
        if(!f.trim()) return;
        // Parseo seguro de comas
        let matches = f.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
        if(!matches) return;
        const c = matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());

        if (c.length > 17) {
            const nombre = c[0];
            const idenParts = (c[17] || '0_1').split('_');
            const isPlayer = idenParts[0] === '1';
            const isActive = idenParts[1] === '1';
            const icon = c[18] ? c[18] : nombre;
            
            if (isPlayer && isActive) {
                jugadoresActivos.push({ nombre, icon });
            }
        }
    });
}

function parsearMisiones(texto) {
    const filas = texto.split(/\r?\n/).map(l => {
        let matches = l.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
        if(!matches) return []; 
        return matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());
    });

    misGlobal.length = 0; 

    filas.slice(1).forEach((c, index) => {
        if(!c || c.length === 0 || !c[0]) return;
        
        misGlobal.push({
            id: c[0], // Columna A: Misiones
            titulo: c[0], 
            tipo: c[1] || 'Personalizada', // Columna B: Tipo
            cupos: parseInt(c[2]) || 0, // Columna C: Necesarios
            estado: parseInt(c[3]) || 0, // Columna D: Activa (0,1,2,3)
            clase: c[4] ? c[4].replace(/Clase/gi, '').trim() : '1', // Columna E: Clase
            desc: c[5] || '', // Columna F: Recompensa
            notaOP: c[6] || '', // Columna G: Nota OP
            jugadores: c[7] ? c[7].split(',').map(j=>j.trim()).filter(j=>j) : [], // Columna H: Jugadores
            autor: c[9] || 'OP', // Columna J: Autor
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
