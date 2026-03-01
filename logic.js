import { invGlobal, objGlobal, historial, guardar } from './state.js';

export function modificar(j, o, c, callback) {
    if (!invGlobal[j]) invGlobal[j] = {};
    invGlobal[j][o] = Math.max(0, (invGlobal[j][o] || 0) + c);
    historial.push({ fecha: new Date().toLocaleString(), jugador: j, objeto: o, cambio: c, total: invGlobal[j][o] });
    guardar(); callback(); 
}

export async function descargarInventariosJPG() {
    const jugadores = Object.keys(invGlobal);
    const originalPage = document.querySelector('.pagina[style*="display: block"]')?.id.replace('pag-', '') || 'op-menu';
    window.mostrarPagina('inventarios');
    for (const j of jugadores) {
        window.setInv(j); 
        await new Promise(r => setTimeout(r, 1800));
        const el = document.getElementById('contenedor-jugadores');
        const canvas = await html2canvas(el, { backgroundColor: '#120024', scale: 2, useCORS: true });
        const link = document.createElement('a');
        link.download = `Inventario_${j}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.9);
        link.click();
    }
    window.mostrarPagina(originalPage);
}

export function descargarEstadoCSV() {
    let csv = "\uFEFFObjeto,Tipo,Material,Efecto,Rareza,Dueños,Cantidades\n"; 
    Object.keys(objGlobal).sort().forEach(o => {
        const info = objGlobal[o];
        let d = [], c = [];
        Object.keys(invGlobal).forEach(jug => {
            if (invGlobal[jug][o] > 0) { d.push(jug); c.push(invGlobal[jug][o]); }
        });
        csv += `"${o}","${info.tipo}","${info.mat}","${info.eff}","${info.rar}","${d.join(', ')}","${c.join(', ')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HEX_ESTADO.csv`;
    link.click();
}

export function descargarLog() {
    let csv = "Fecha,Jugador,Objeto,Cambio,Total\n";
    historial.forEach(h => csv += `"${h.fecha}","${h.jugador}","${h.objeto}",${h.cambio},${h.total}\n`);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'log_hex.csv'; link.click();
}

export function importarLog(contenido, callback) {
    const filas = contenido.split(/\r?\n/).slice(1);
    filas.forEach(f => {
        const c = f.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(x => x.replace(/^"|"$/g, '').trim());
        if (c.length >= 5) {
            if (!invGlobal[c[1]]) invGlobal[c[1]] = {};
            invGlobal[c[1]][c[2]] = parseInt(c[4]);
        }
    });
    guardar(); callback();
}

export function resetDB() { if(confirm("¿Borrar todo?")) { localStorage.clear(); location.reload(); } }
