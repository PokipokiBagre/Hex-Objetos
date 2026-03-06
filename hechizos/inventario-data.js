import { db } from './inventario-state.js';

// ¡NUEVA URL ACTUALIZADA!
const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycbyp-hLbZnjh2_r_0X7diffLulJvh38yMr1DjRLu-Kf43NAarRhTfITMeeSAiluM1Nalmg/exec';
const CSV_PERSONAJES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv';

export async function inicializarDatos() {
    try {
        // 1. Obtener Personajes desde el CSV
        const resPj = await fetch(CSV_PERSONAJES + '&cb=' + new Date().getTime());
        const txtPj = await resPj.text();
        parsearCSVPersonajes(txtPj);

        // 2. Obtener Hechizos (Cifrados) desde la nueva API
        const resHz = await fetch(API_HECHIZOS);
        const txtCifrado = await resHz.text();
        
        // Desciframos la data Base64 a JSON
        const jsonStr = decodeURIComponent(escape(window.atob(txtCifrado)));
        db.hechizos = JSON.parse(jsonStr);
        
        return true;
    } catch (e) {
        console.error("Fallo de sincronización:", e);
        return false;
    }
}

function parsearCSVPersonajes(texto) {
    const filas = texto.split(/\r?\n/).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    const headers = filas[0];
    
    filas.slice(1).forEach(f => {
        if(!f[0]) return;
        const nombre = f[0];
        const idenStr = f[17] || '0_1'; 
        const idenParts = idenStr.split('_');
        
        db.personajes[nombre] = {
            isPlayer: idenParts[0] === '1',
            isActive: idenParts[1] === '1',
            iconoOverride: f[18] || nombre,
            hex: f[1] ? f[1].split('_')[0] : 0,
            vex: f[2] || 0
        };
    });
}

// ESCRITURA (POST) - ENVÍA LA COLA A GOOGLE SHEETS
export async function sincronizarColaBD(cola) {
    try {
        const response = await fetch(API_HECHIZOS, {
            method: 'POST',
            body: JSON.stringify({
                accion: 'sincronizar_inventario',
                datos: cola.agregar // Por ahora solo enviaremos los agregados
            })
        });
        
        const result = await response.json();
        return result.status === 'success';
    } catch (error) {
        console.error("Error al sincronizar con Sheets:", error);
        return false;
    }
}
