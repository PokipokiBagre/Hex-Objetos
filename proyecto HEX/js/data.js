import { invGlobal, objGlobal, guardar } from './state.js';

const normalizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

export async function cargarTodoDesdeCSV() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaNKT4_xKJJ93q2NIhx4_pV6jxuEW4QXeLRdrAxWu9uQFljf5EBAacu9YNc3QMbaobTUoRuhqio5H5/pub?output=csv";
    try {
        const res = await fetch(sheetURL);
        const texto = await res.text();
        const filas = texto.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
        
        const mapaNorm = {}; 

        filas.slice(1).forEach(f => {
            const nombre = f[1]; if (!nombre) return;
            const id = normalizar(nombre);
            const infoNueva = { tipo: f[2], mat: f[3], eff: f[4], rar: f[5] || 'Común' };
            if (!mapaNorm[id] || (objGlobal[mapaNorm[id]]?.eff === 'Sin descripción' && infoNueva.eff !== "")) {
                if (mapaNorm[id]) delete objGlobal[mapaNorm[id]];
                mapaNorm[id] = nombre;
                objGlobal[nombre] = infoNueva;
            }
        });

        filas.slice(1).forEach(f => {
            const objs = f[6] ? f[6].split(',').map(n => n.trim()) : [];
            const jugs = f[8] ? f[8].split(',').map(j => j.trim()) : [];
            const cant = parseInt(f[7]) || 0;
            objs.forEach(o => {
                const nombreOficial = mapaNorm[normalizar(o)] || o;
                if (!objGlobal[nombreOficial]) objGlobal[nombreOficial] = { tipo: '?', mat: '?', eff: 'Sin descripción', rar: 'Común' };
                jugs.forEach(jRaw => {
                    let j = jRaw.includes("Corvin") ? "Corvin Vaelen" : jRaw;
                    if (!invGlobal[j]) invGlobal[j] = {};
                    invGlobal[j][nombreOficial] = (invGlobal[j][nombreOficial] || 0) + cant;
                });
            });
        });
        guardar();
    } catch (e) { console.error("Error cargando datos:", e); }
}