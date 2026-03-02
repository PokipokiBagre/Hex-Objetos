import { statsGlobal, estadoUI, guardar } from './stats-state.js';

const URL_STATS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZD7f7YtuNnIH1P_KWABhRFDos3GnX4dkkUUE0zpRgNiKPvtbX2kOx4N-CGi0Rc4FPKYYZxXbeJFR/pub?output=csv";
const URL_OBJS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQDaZ1Zr9YWmgW05Hzpv4IQzpMaKrgSvVUm_Yrps3DdwwPpIjD4iHrdLyPHGucuTHnwwYdM7bPrcnRO/pub?output=csv";

export async function cargarTodo() {
    try {
        // 1. Cargar Estadísticas (Linda, Corvin...)
        const resS = await fetch(URL_STATS + "&cb=" + Date.now());
        const textS = await resS.text();
        const filasS = textS.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));

        for (let k in statsGlobal) delete statsGlobal[k];

        filasS.slice(1).forEach(f => {
            const id = f[0]; if (!id) return;
            statsGlobal[id] = {
                hx: parseInt(f[1]) || 0, vx: parseInt(f[2]) || 0,
                af: { fi: parseInt(f[3])||0, en: parseInt(f[4])||0, es: parseInt(f[5])||0, ma: parseInt(f[6])||0, ps: parseInt(f[7])||0, os: parseInt(f[8])||0 },
                vi: { r: parseInt(f[9])||0, rM: parseInt(f[10])||0, a: parseInt(f[11])||0, g: parseInt(f[12])||0 },
                da: { r: f[13]||0, a: f[14]||0, e: f[15]||0 },
                spAf: f[16] ? f[16].split(',') : [],
                spNom: f[17] ? f[17].split(',') : []
            };
        });

        // 2. Escanear Objetos (Yuko, Volvo...)
        const resO = await fetch(URL_OBJS + "&cb=" + Date.now());
        const textO = await resO.text();
        const filasO = textO.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));

        filasO.slice(1).forEach(f => {
            const owners = f[5] ? f[5].split(',').map(d => d.trim()) : [];
            owners.forEach(d => {
                if (d && !statsGlobal[d]) {
                    statsGlobal[d] = { hx:0, vx:0, af:{fi:0,en:0,es:0,ma:0,ps:0,os:0}, vi:{r:0,rM:10,a:0,g:0}, da:{r:0,a:0,e:0}, spAf:[], spNom:[] };
                }
                if (d && !estadoUI.principales.includes(d)) estadoUI.principales.push(d);
            });
        });

        guardar(); return true;
    } catch (e) { console.error("Error en Fusión:", e); return false; }
}
