import { statsGlobal, listaEstados, estadoUI, dbExtra } from './stats-state.js';

// Rutas CSV y API
const CSV_PERSONAJES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv';
const CSV_OBJETOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQDaZ1Zr9YWmgW05Hzpv4IQzpMaKrgSvVUm_Yrps3DdwwPpIjD4iHrdLyPHGucuTHnwwYdM7bPrcnRO/pub?output=csv';
const API_HECHIZOS = 'https://script.google.com/macros/s/AKfycby1jLgF-2bGWv0QW0Eg8u7msZ-ab2eQa--olIWQHsin8Kyz0y0xHevK7YyGyMyzq1BWKw/exec';

export async function cargarTodoDesdeCSV() {
    try {
        // 1. Cargar Estadísticas base
        const resPj = await fetch(CSV_PERSONAJES + '&cb=' + new Date().getTime());
        procesarTextoCSV(await resPj.text());
        
        // 2. Cargar Conteo de Objetos
        const resObj = await fetch(CSV_OBJETOS + '&cb=' + new Date().getTime());
        procesarObjetos(await resObj.text());

        // 3. Cargar Hechizos
        const resHz = await fetch(API_HECHIZOS);
        dbExtra.hechizos = JSON.parse(decodeURIComponent(escape(window.atob(await resHz.text()))));
        
    } catch (error) {
        console.error("Error cargando bases de datos cruzadas:", error);
    }
}

function procesarObjetos(texto) {
    const filas = texto.split(/\r?\n/).map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
    dbExtra.objetos = {};
    filas.slice(1).forEach(f => {
        const nombre = f[0]; if (!nombre) return;
        const jugs = f[5] ? f[5].split(',').map(j => j.trim().toLowerCase()) : [];
        const cants = f[6] ? f[6].split(',').map(c => parseInt(c.trim()) || 0) : [];
        jugs.forEach((j, i) => {
            if (!dbExtra.objetos[j]) dbExtra.objetos[j] = 0;
            dbExtra.objetos[j] += cants[i] || 0; // Suma la cantidad total de objetos que posee el personaje
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
        const getBase = (idx) => parseInt((f[idx] || '0').split('_')[0]) || 0;
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
            vidaRojaActual: parseInt(f[9]) || 0, vidaRojaMax: getBase(10),
            vidaAzul: getBase(11), baseVidaAzul: getBase(11),
            guardaDorada: getBase(12), baseGuardaDorada: getBase(12),
            danoRojo: getBase(13), danoAzul: getBase(14), elimDorada: getBase(15),
            afinidades: { fisica: getBase(3), energetica: getBase(4), espiritual: getBase(5), mando: getBase(6), psiquica: getBase(7), oscura: getBase(8) },
            hechizos: { fisica: getSpell(3), energetica: getSpell(4), espiritual: getSpell(5), mando: getSpell(6), psiquica: getSpell(7), oscura: getSpell(8), danoRojo: getSpell(13), danoAzul: getSpell(14), elimDorada: getSpell(15), vidaRojaMaxExtra: getSpell(10), vidaAzulExtra: getSpell(11), guardaDoradaExtra: getSpell(12) },
            hechizosEfecto: { fisica: getSpellEff(3), energetica: getSpellEff(4), espiritual: getSpellEff(5), mando: getSpellEff(6), psiquica: getSpellEff(7), oscura: getSpellEff(8), danoRojo: getSpellEff(13), danoAzul: getSpellEff(14), elimDorada: getSpellEff(15), vidaRojaMaxExtra: getSpellEff(10), vidaAzulExtra: getSpellEff(11), guardaDoradaExtra: getSpellEff(12) },
            buffs: { fisica: getBuff(3), energetica: getBuff(4), espiritual: getBuff(5), mando: getBuff(6), psiquica: getBuff(7), oscura: getBuff(8), danoRojo: getBuff(13), danoAzul: getBuff(14), elimDorada: getBuff(15), vidaRojaMaxExtra: getBuff(10), vidaAzulExtra: getBuff(11), guardaDoradaExtra: getBuff(12) },
            estados: stData, iconoOverride: f[18] || ""
        };
    });
}

// DICCIONARIO REVERTIDO: Usa descripciones genéricas para aplicar lo que viene del CSV
export async function cargarDiccionarioEstados() {
    listaEstados.push({ id:'envenenado', nombre:'Envenenado', tipo:'numero', desc:'Pierde corazones rojos por turno.', bg:'#4a004a', border:'#ff00ff' });
    listaEstados.push({ id:'quemado', nombre:'Quemado', tipo:'numero', desc:'Pierde corazones rojos por turno.', bg:'#4a0000', border:'#ff4444' });
    listaEstados.push({ id:'congelado', nombre:'Congelado', tipo:'numero', desc:'Reduce evasión.', bg:'#00224a', border:'#00ccff' });
    listaEstados.push({ id:'paralizado', nombre:'Paralizado', tipo:'numero', desc:'Falla tiradas de dados.', bg:'#4a4a00', border:'#ffff00' });
    listaEstados.push({ id:'aturdido', nombre:'Aturdido', tipo:'booleano', desc:'Pierde turnos.', bg:'#555', border:'#fff' });
    listaEstados.push({ id:'cegado', nombre:'Cegado', tipo:'booleano', desc:'Falla ataques.', bg:'#111', border:'#666' });
    listaEstados.push({ id:'silenciado', nombre:'Silenciado', tipo:'booleano', desc:'No puede castear hechizos.', bg:'#220022', border:'#aa00aa' });
    listaEstados.push({ id:'petrificado', nombre:'Petrificado', tipo:'booleano', desc:'Inmune pero inactivo.', bg:'#333', border:'#888' });
    listaEstados.push({ id:'inmune', nombre:'Inmune', tipo:'booleano', desc:'Inmune a daño.', bg:'#003300', border:'#00ff00' });
    listaEstados.push({ id:'escondido', nombre:'Escondido', tipo:'booleano', desc:'No puede ser seleccionado.', bg:'#000', border:'#444' });
    listaEstados.push({ id:'huesos', nombre:'Huesos Rotos', tipo:'booleano', desc:'Física reducida.', bg:'#fff', border:'#000' });
    listaEstados.push({ id:'secuestrado', nombre:'Secuestrado', tipo:'booleano', desc:'Removido del campo.', bg:'#110000', border:'#ff0000' });
}
