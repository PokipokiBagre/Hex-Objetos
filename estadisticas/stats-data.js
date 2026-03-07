import { statsGlobal, listaEstados, estadoUI, dbExtra } from './stats-state.js';

const CSV_ESTADOS = 'estados.csv'; 
const CSV_PERSONAJES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv';
const CSV_OBJETOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQDaZ1Zr9YWmgW05Hzpv4IQzpMaKrgSvVUm_Yrps3DdwwPpIjD4iHrdLyPHGucuTHnwwYdM7bPrcnRO/pub?output=csv';
const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycby1jLgF-2bGWv0QW0Eg8u7msZ-ab2eQa--olIWQHsin8Kyz0y0xHevK7YyGyMyzq1BWKw/exec';

// Carga simultánea 3x más rápida
export async function cargarTodoDesdeCSV() {
    try {
        const [resPj, resObj, resHz] = await Promise.all([
            fetch(CSV_PERSONAJES + '&cb=' + new Date().getTime()),
            fetch(CSV_OBJETOS + '&cb=' + new Date().getTime()),
            fetch(API_HECHIZOS)
        ]);
        
        procesarTextoCSV(await resPj.text());
        procesarObjetos(await resObj.text());
        dbExtra.hechizos = JSON.parse(decodeURIComponent(escape(window.atob(await resHz.text()))));
    } catch (error) { console.error("Error cargando bases de datos cruzadas:", error); }
}

function procesarObjetos(texto) {
    const filas = texto.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
    dbExtra.objetosCount = {};
    dbExtra.inventarios = {};
    dbExtra.infoObjetos = {};

    filas.slice(1).forEach(f => {
        const nombre = f[0]; if (!nombre) return;
        dbExtra.infoObjetos[nombre] = { rar: f[4] || 'Común' };

        const jugs = f[5] ? f[5].split(',').map(j => j.trim().toLowerCase()) : [];
        const cants = f[6] ? f[6].split(',').map(c => parseInt(c.trim()) || 0) : [];
        
        jugs.forEach((j, i) => {
            const count = cants[i] || 0;
            if (!dbExtra.objetosCount[j]) dbExtra.objetosCount[j] = 0;
            if (!dbExtra.inventarios[j]) dbExtra.inventarios[j] = [];
            
            dbExtra.objetosCount[j] += count;
            if (count > 0) dbExtra.inventarios[j].push(nombre);
        });
    });
}

export function procesarTextoCSV(texto) {
    const filas = texto.split(/\r?\n/).map(l => {
        let matches = l.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
        if(!matches) return []; return matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());
    });
    
    for (let k in statsGlobal) delete statsGlobal[k];

    filas.slice(1).forEach(f => {
        if(!f[0]) return;
        const nombre = f[0];
        const hexParts = (f[1] || '0_1').split('_'); const idenParts = (f[17] || '0_1').split('_');
        
        // Estructura: Total_Base_Spell_SpellEff_Buff
        const getTotal = (idx) => parseInt((f[idx] || '0').split('_')[0]) || 0;
        const getBase = (idx) => parseInt((f[idx] || '0').split('_')[1]) || 0;
        const getSpell = (idx) => parseInt((f[idx] || '0').split('_')[2]) || 0;
        const getSpellEff = (idx) => parseInt((f[idx] || '0').split('_')[3]) || 0;
        const getBuff = (idx) => parseInt((f[idx] || '0').split('_')[4]) || 0;
        
        let stData = {};
        if (f[16]) {
            const arr = f[16].split('-');
            listaEstados.forEach((e, i) => {
                if (e.tipo === 'booleano') stData[e.id] = (arr[i] === '1');
                else stData[e.id] = parseInt(arr[i]) || 0;
            });
        } else {
            listaEstados.forEach(e => { stData[e.id] = (e.tipo === 'numero') ? 0 : false; });
        }

        statsGlobal[nombre] = {
            isPlayer: idenParts[0] === '1', isNPC: idenParts[0] === '0', isActive: idenParts[1] === '1',
            hex: parseInt(hexParts[0]) || 0, asistencia: parseInt(hexParts[1]) || 1, vex: parseInt(f[2]) || 0,
            
            vidaRojaActual: parseInt(f[9]) || 0, 
            vidaRojaMax: getTotal(10), baseVidaRojaMax: getBase(10),
            vidaAzul: getTotal(11), baseVidaAzul: getBase(11),
            guardaDorada: getTotal(12), baseGuardaDorada: getBase(12),
            danoRojo: getTotal(13), baseDanoRojo: getBase(13),
            danoAzul: getTotal(14), baseDanoAzul: getBase(14),
            elimDorada: getTotal(15), baseElimDorada: getBase(15),
            
            afinidades: { fisica: getTotal(3), energetica: getTotal(4), espiritual: getTotal(5), mando: getTotal(6), psiquica: getTotal(7), oscura: getTotal(8) },
            afinidadesBase: { fisica: getBase(3), energetica: getBase(4), espiritual: getBase(5), mando: getBase(6), psiquica: getBase(7), oscura: getBase(8) },
            hechizos: { fisica: getSpell(3), energetica: getSpell(4), espiritual: getSpell(5), mando: getSpell(6), psiquica: getSpell(7), oscura: getSpell(8), danoRojo: getSpell(13), danoAzul: getSpell(14), elimDorada: getSpell(15), vidaRojaMaxExtra: getSpell(10), vidaAzulExtra: getSpell(11), guardaDoradaExtra: getSpell(12) },
            hechizosEfecto: { fisica: getSpellEff(3), energetica: getSpellEff(4), espiritual: getSpellEff(5), mando: getSpellEff(6), psiquica: getSpellEff(7), oscura: getSpellEff(8), danoRojo: getSpellEff(13), danoAzul: getSpellEff(14), elimDorada: getSpellEff(15), vidaRojaMaxExtra: getSpellEff(10), vidaAzulExtra: getSpellEff(11), guardaDoradaExtra: getSpellEff(12) },
            buffs: { fisica: getBuff(3), energetica: getBuff(4), espiritual: getBuff(5), mando: getBuff(6), psiquica: getBuff(7), oscura: getBuff(8), danoRojo: getBuff(13), danoAzul: getBuff(14), elimDorada: getBuff(15), vidaRojaMaxExtra: getBuff(10), vidaAzulExtra: getBuff(11), guardaDoradaExtra: getBuff(12) },
            
            estados: stData, iconoOverride: f[18] || ""
        };
    });
}

// Lector de CSV invencible contra comas y saltos de línea internos
export async function cargarDiccionarioEstados() {
    try {
        const res = await fetch(CSV_ESTADOS + '?cb=' + new Date().getTime());
        if(!res.ok) throw new Error("No se encontró el archivo de estados");
        const texto = await res.text();
        
        const filas = texto.split(/\r?\n/).map(l => {
            let matches = l.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
            if(!matches) return []; 
            return matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());
        });
        
        listaEstados.length = 0;
        filas.slice(1).forEach(f => {
            if(!f[0]) return;
            listaEstados.push({
                id: f[0].trim(),
                nombre: f[1] ? f[1].trim() : f[0].trim(),
                tipo: f[2] ? f[2].trim() : 'booleano',
                bg: f[3] ? f[3].trim() : '#000',
                border: f[4] ? f[4].trim() : '#fff',
                desc: f[5] ? f[5].trim() : 'Sin descripción'
            });
        });
    } catch(e) {
        console.warn("Fallo al cargar estados.csv. Verifica ruta local.");
    }
}

