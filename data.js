import { invGlobal, objGlobal, guardar } from './state.js';

const normalizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

export async function cargarTodoDesdeCSV() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQDaZ1Zr9YWmgW05Hzpv4IQzpMaKrgSvVUm_Yrps3DdwwPpIjD4iHrdLyPHGucuTHnwwYdM7bPrcnRO/pub?output=csv&cachebust=" + new Date().getTime();
    
    try {
        const res = await fetch(sheetURL);
        const texto = await res.text();
        const filas = texto.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
        
        for (let k in invGlobal) delete invGlobal[k];
        for (let k in objGlobal) delete objGlobal[k];

        const mapaNorm = {}; 

filas.slice(1).forEach(f => {
    const nombreObj = f[0];
    const jugs = f[5] ? f[5].split(',').map(j => j.trim()) : [];
    const cants = f[6] ? f[6].split(',').map(c => parseInt(c.trim()) || 0) : [];

    const nombreOficial = mapaNorm[normalizar(nombreObj)] || nombreObj;

    jugs.forEach((jRaw, i) => {
        let j = jRaw; 
        
        if (!invGlobal[j]) invGlobal[j] = {};
        invGlobal[j][nombreOficial] = (cants[i] || 0);
    });
});
        guardar();
    } catch (e) { console.error("Error cargando datos:", e); }
}

