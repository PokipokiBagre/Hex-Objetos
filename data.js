import { invGlobal, objGlobal, guardar } from './state.js';

const normalizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

export async function cargarTodoDesdeCSV() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQDaZ1Zr9YWmgW05Hzpv4IQzpMaKrgSvVUm_Yrps3DdwwPpIjD4iHrdLyPHGucuTHnwwYdM7bPrcnRO/pub?output=csv&cachebust=" + new Date().getTime();
    
    try {
        const res = await fetch(sheetURL);
        const texto = await res.text();
        const filas = texto.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
        const mapaNorm = {}; 

        // 1. Catálogo (A-E)
        filas.slice(1).forEach(f => {
            const nombre = f[0]; if (!nombre) return;
            const id = normalizar(nombre);
            const infoNueva = { tipo: f[1] || '-', mat: f[2] || '-', eff: f[3] || 'Sin descripción', rar: f[4] || 'Común' };
            if (!mapaNorm[id] || (objGlobal[mapaNorm[id]]?.eff === 'Sin descripción' && infoNueva.eff !== "")) {
                if (mapaNorm[id]) delete objGlobal[mapaNorm[id]];
                mapaNorm[id] = nombre;
                objGlobal[nombre] = infoNueva;
            }
        });

        // 2. Inventarios (F-G)
        filas.slice(1).forEach(f => {
            const nombreObj = f[0];
            const jugs = f[5] ? f[5].split(',').map(j => j.trim()) : [];
            const cants = f[6] ? f[6].split(',').map(c => parseInt(c.trim()) || 0) : [];
            const nombreOficial = mapaNorm[normalizar(nombreObj)] || nombreObj;

            if (!objGlobal[nombreOficial]) objGlobal[nombreOficial] = { tipo: '-', mat: '-', eff: 'Sin descripción', rar: 'Común' };

            jugs.forEach((jRaw, i) => {
                let j = jRaw.includes("Corvin") ? "Corvin Vaelen" : jRaw;
                if (!invGlobal[j]) invGlobal[j] = {};
                invGlobal[j][nombreOficial] = (invGlobal[j][nombreOficial] || 0) + (cants[i] || 0);
            });
        });
        guardar();
    } catch (e) { console.error("Error cargando Sheet:", e); }
}
