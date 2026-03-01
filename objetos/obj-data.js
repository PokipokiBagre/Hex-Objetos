import { invGlobal, objGlobal, guardar } from './obj-state.js';

export async function cargarTodoDesdeCSV() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQDaZ1Zr9YWmgW05Hzpv4IQzpMaKrgSvVUm_Yrps3DdwwPpIjD4iHrdLyPHGucuTHnwwYdM7bPrcnRO/pub?output=csv&cachebust=" + new Date().getTime();
    try {
        const res = await fetch(sheetURL);
        const texto = await res.text();
        const filas = texto.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
        
        for (let k in invGlobal) delete invGlobal[k];
        for (let k in objGlobal) delete objGlobal[k];

        filas.slice(1).forEach(f => {
            const nombre = f[0]; if (!nombre) return;
            
            // Mapeo de Columnas: H=Desc, I=Física, J=Energética, K=Espiritual, L=Mando, M=Psíquica, N=Oscura
            objGlobal[nombre] = { 
                tipo: f[1] || '-', 
                mat: f[2] || '-', 
                eff: f[3] || 'Sin descripción', 
                rar: f[4] || 'Común',
                desc: f[7] || '', 
                afinidades: {
                    "Física": parseInt(f[8]) || 0,
                    "Energética": parseInt(f[9]) || 0,
                    "Espiritual": parseInt(f[10]) || 0,
                    "Mando": parseInt(f[11]) || 0,
                    "Psíquica": parseInt(f[12]) || 0,
                    "Oscura": parseInt(f[13]) || 0
                }
            };

            const jugs = f[5] ? f[5].split(',').map(j => j.trim()) : [];
            const cants = f[6] ? f[6].split(',').map(c => parseInt(c.trim()) || 0) : [];
            jugs.forEach((j, i) => {
                if (!invGlobal[j]) invGlobal[j] = {};
                invGlobal[j][nombre] = (cants[i] || 0);
            });
        });
        guardar();
    } catch (e) { console.error("Error cargando CSV:", e); }
}
