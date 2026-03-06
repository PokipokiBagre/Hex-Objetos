import { db } from './inventario-state.js';

const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycbxGljbIDdn-q7v6QeRr4tMsCmW_EHwuTvxTkZ92KRCm0C80UOANRAc_UdByPTwJDw8_bw/exec';
const CSV_PERSONAJES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv';

export async function inicializarDatos() {
    try {
        const resPj = await fetch(CSV_PERSONAJES + '&cb=' + new Date().getTime());
        parsearCSVPersonajes(await resPj.text());
        const resHz = await fetch(API_HECHIZOS);
        db.hechizos = JSON.parse(decodeURIComponent(escape(window.atob(await resHz.text()))));
        return true;
    } catch (e) { console.error("Error:", e); return false; }
}

function parsearCSVPersonajes(texto) {
    const filas = texto.split(/\r?\n/).map(l => {
        let matches = l.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
        if(!matches) return []; return matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());
    });
    db.csvHeadersPersonajes = filas[0];
    for (let k in db.personajes) delete db.personajes[k];

    filas.slice(1).forEach(f => {
        if(!f[0]) return;
        const nombre = f[0]; const idenParts = (f[17] || '0_1').split('_');
        
        const getBase = (idx) => parseInt((f[idx] || '0').split('_')[0]) || 0;
        const afis = { 'Física': getBase(3), 'Energética': getBase(4), 'Espiritual': getBase(5), 'Mando': getBase(6), 'Psíquica': getBase(7), 'Oscura': getBase(8) };
        let mayorAfinidad = 'Ninguna'; let maxVal = -1;
        for (const [key, val] of Object.entries(afis)) { if(val > maxVal && val > 0) { maxVal = val; mayorAfinidad = key; } }

        db.personajes[nombre] = {
            isPlayer: idenParts[0] === '1', isActive: idenParts[1] === '1',
            iconoOverride: f[18] !== '' ? f[18] : nombre,
            hex: f[1] ? parseInt(f[1].split('_')[0]) || 0 : 0,
            mayorAfinidad: mayorAfinidad, rawRow: f 
        };
    });
}

export async function sincronizarColaBD(cola) {
    try {
        const response = await fetch(API_HECHIZOS, { method: 'POST', body: JSON.stringify({ accion: 'sincronizar_inventario', agregar: cola.agregar, quitar: cola.quitar }) });
        return (await response.json()).status === 'success';
    } catch (e) { return false; }
}

export function exportarCSVPersonajes() {
    let csv = db.csvHeadersPersonajes.join(",") + "\n";
    Object.keys(db.personajes).sort().forEach(n => {
        csv += db.personajes[n].rawRow.map((v, i) => (i===0||i===1||i===2||i===9) ? String(v) : `"${v}"`).join(",") + "\n";
    });
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "HEX_PERSONAJES_AFINIDAD_MOD.csv"; link.click();
}
