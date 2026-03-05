import { statsGlobal, listaEstados, guardar } from './stats-state.js';

const parseCell = (str) => {
    if (!str) return { total: 0, base: 0, spells: 0, spellEff: 0, extra: 0 };
    str = str.toString().trim();
    const parts = str.split('_');
    if (parts.length === 5) return { total: parseInt(parts[0])||0, base: parseInt(parts[1])||0, spells: parseInt(parts[2])||0, spellEff: parseInt(parts[3])||0, extra: parseInt(parts[4])||0 };
    if (parts.length === 4) return { total: parseInt(parts[0])||0, base: parseInt(parts[1])||0, spells: parseInt(parts[2])||0, spellEff: 0, extra: parseInt(parts[3])||0 };
    if (parts.length === 2) return { total: (parseInt(parts[0])||0)+(parseInt(parts[1])||0), base: parseInt(parts[0])||0, spells: 0, spellEff: 0, extra: parseInt(parts[1])||0 };
    const v = parseInt(str)||0; return { total: v, base: v, spells: 0, spellEff: 0, extra: 0 };
};

export async function cargarDiccionarioEstados() {
    try {
        const resEst = await fetch('estados.csv?v=' + new Date().getTime());
        if (!resEst.ok) { console.warn("No se encontró estados.csv"); return; }
        const txtEst = await resEst.text();
        const filasEst = txtEst.split(/\r?\n/).map(l => l.split(',').map(c => c.trim()));
        listaEstados.length = 0;
        filasEst.slice(1).forEach(f => {
            if(f[0]) listaEstados.push({ id: f[0], nombre: f[1], tipo: f[2], bg: f[3], border: f[4], desc: f[5] });
        });
    } catch(e) { console.error("Error leyendo estados.csv:", e); }
}

export async function cargarTodoDesdeCSV() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOl-ENpkVGioSaquRc1pkuNUyk-vCEQGGSAN3MMtzwcP5AjlLTLbjsc4wAdy3fcQgRhzQAZ2CtRWbx/pub?output=csv&cachebust=" + new Date().getTime();
    try {
        await cargarDiccionarioEstados();
        const res = await fetch(sheetURL); 
        procesarTextoCSV(await res.text()); 
        return true; 
    } 
    catch (e) { console.error("Error cargando CSV principal:", e); return false; }
}

export function procesarTextoCSV(texto) {
    const filas = texto.split(/\r?\n/).map(l => {
        let matches = l.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
        if(!matches) return []; return matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());
    });

    for (let k in statsGlobal) delete statsGlobal[k];

    filas.slice(1).forEach((f) => {
        const nombre = f[0]; if (!nombre) return;
        const cols = Array.from({length: 19}, (_, i) => f[i] || '');
        const est = cols[16].split('-');
        
        const idenStr = cols[17] || '0_1'; 
        const idenParts = idenStr.split('_');
        const esJugador = idenParts[0] === '1';
        const esActivo = idenParts[1] === '1';
        const copiaOverride = cols[18].trim();

        const hexRaw = cols[1] || '0';
        const hexParts = hexRaw.toString().split('_');
        const hexVal = parseInt(hexParts[0]) || 0;
        const asisVal = hexParts.length > 1 ? parseInt(hexParts[1]) : (esJugador ? 1 : 0);

        const fFis = parseCell(cols[3]); const fEne = parseCell(cols[4]);
        const fEsp = parseCell(cols[5]); const fMan = parseCell(cols[6]);
        const fPsi = parseCell(cols[7]); const fOsc = parseCell(cols[8]);

        const fVRM = parseCell(cols[10]); const fVA = parseCell(cols[11]); const fGD = parseCell(cols[12]);
        const fDR = parseCell(cols[13]); const fDA = parseCell(cols[14]); const fED = parseCell(cols[15]);

        let baseVRM = fVRM.base; 
        let baseVA = fVA.base;

        let estadosPers = {};
        listaEstados.forEach((estadoInfo, i) => {
            let val = est[i] || '0';
            if (estadoInfo.tipo === 'numero') estadosPers[estadoInfo.id] = parseInt(val) || 0;
            else estadosPers[estadoInfo.id] = (val === '1');
        });

        statsGlobal[nombre] = {
            isPlayer: esJugador, isNPC: !esJugador, isActive: esActivo,
            iconoOverride: copiaOverride !== '' ? copiaOverride : null, 
            hex: hexVal, asistencia: asisVal, vex: parseInt(cols[2]) || 0,
            
            afinidades: { fisica: fFis.base, energetica: fEne.base, espiritual: fEsp.base, mando: fMan.base, psiquica: fPsi.base, oscura: fOsc.base },
            hechizos: { fisica: fFis.spells, energetica: fEne.spells, espiritual: fEsp.spells, mando: fMan.spells, psiquica: fPsi.spells, oscura: fOsc.spells, danoRojo: fDR.spells, danoAzul: fDA.spells, elimDorada: fED.spells, vidaRojaMaxExtra: fVRM.spells, vidaAzulExtra: fVA.spells, guardaDoradaExtra: fGD.spells },
            hechizosEfecto: { fisica: fFis.spellEff, energetica: fEne.spellEff, espiritual: fEsp.spellEff, mando: fMan.spellEff, psiquica: fPsi.spellEff, oscura: fOsc.spellEff, danoRojo: fDR.spellEff, danoAzul: fDA.spellEff, elimDorada: fED.spellEff, vidaRojaMaxExtra: fVRM.spellEff, vidaAzulExtra: fVA.spellEff, guardaDoradaExtra: fGD.spellEff },
            buffs: { fisica: fFis.extra, energetica: fEne.extra, espiritual: fEsp.extra, mando: fMan.extra, psiquica: fPsi.extra, oscura: fOsc.extra, danoRojo: fDR.extra, danoAzul: fDA.extra, elimDorada: fED.extra, vidaRojaMaxExtra: fVRM.extra, vidaAzulExtra: fVA.extra, guardaDoradaExtra: fGD.extra },
            
            vidaRojaActual: parseInt(cols[9]) || 0, 
            vidaRojaMax: baseVRM || 10,
            vidaAzul: baseVA || 0, baseVidaAzul: baseVA || 0, 
            guardaDorada: fGD.base || 0, baseGuardaDorada: fGD.base || 0,
            danoRojo: fDR.base, danoAzul: fDA.base, elimDorada: fED.base,
            estados: estadosPers 
        };
    });
    guardar();
}
