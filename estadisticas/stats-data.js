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

    // Los primeros 6 son Jugadores (índice 0 a 5)
    filas.slice(1).forEach((f, index) => {
        const nombre = f[0]; 
        if (!nombre) return;
        
        // Ampliado a 17 columnas para abarcar la columna Q (Estado)
        const cols = Array.from({length: 17}, (_, i) => f[i] || '');
        const esJugador = index < 6;

        // Decodificamos la columna de Estado (Ej: "3-7-0-1-0-0-0...")
        const est = cols[16].split('-');

        statsGlobal[nombre] = {
            isPlayer: esJugador,
            isNPC: !esJugador,
            hex: parseInt(cols[1]) || 0,
            vex: parseInt(cols[2]) || 0,
            afinidades: {
                fisica: parseInt(cols[3]) || 0, energetica: parseInt(cols[4]) || 0,
                espiritual: parseInt(cols[5]) || 0, mando: parseInt(cols[6]) || 0,
                psiquica: parseInt(cols[7]) || 0, oscura: parseInt(cols[8]) || 0
            },
            vidaRojaActual: parseInt(cols[9]) || 0, vidaRojaMax: parseInt(cols[10]) || 0,
            vidaAzul: parseInt(cols[11]) || 0, baseVidaAzul: parseInt(cols[11]) || 0,
            guardaDorada: parseInt(cols[12]) || 0, baseGuardaDorada: parseInt(cols[12]) || 0,
            danoRojo: parseInt(cols[13]) || 0, danoAzul: parseInt(cols[14]) || 0, elimDorada: parseInt(cols[15]) || 0,
            
            buffs: { fisica:0, energetica:0, espiritual:0, mando:0, psiquica:0, oscura:0, danoRojo:0, danoAzul:0, elimDorada:0, vidaRojaMaxExtra:0, vidaAzulExtra:0, guardaDoradaExtra:0 },
            
            // Se asignan los valores decodificados (si la columna estaba vacía, se asumen 0 y false)
            estados: { 
                veneno: parseInt(est[0]) || 0, 
                radiacion: parseInt(est[1]) || 0, 
                maldito: est[2] === '1', 
                incapacitado: est[3] === '1', 
                debilitado: est[4] === '1', 
                angustia: est[5] === '1', 
                petrificacion: est[6] === '1', 
                secuestrado: est[7] === '1', 
                huesos: est[8] === '1', 
                comestible: est[9] === '1', 
                cifrado: est[10] === '1', 
                inversion: est[11] === '1', 
                verde: est[12] === '1' 
            }
        };
    });
    guardar();
}
