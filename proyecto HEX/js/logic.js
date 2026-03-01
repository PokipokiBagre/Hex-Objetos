import { invGlobal, objGlobal, historial, guardar } from './state.js';

export function modificar(j, o, c, callback) {
    if (!invGlobal[j]) invGlobal[j] = {};
    invGlobal[j][o] = Math.max(0, (invGlobal[j][o] || 0) + c);
    historial.push({ fecha: new Date().toLocaleString(), jugador: j, objeto: o, cambio: c, total: invGlobal[j][o] });
    guardar(); callback(); 
}

// MOTOR DE CAPTURA BLINDADO
export async function descargarInventariosJPG() {
    const jugadores = Object.keys(invGlobal);
    if (jugadores.length === 0) return alert("No hay datos.");

    // Guardamos en qué página estamos para volver al final
    const paginaActual = document.querySelector('.pagina[style*="display: block"]')?.id || 'pag-op-menu';
    
    // Forzamos visibilidad de inventarios para que html2canvas pueda medir el tamaño
    window.mostrarPagina('inventarios');

    for (const j of jugadores) {
        window.setInv(j); // Cambia la tabla al jugador actual
        await new Promise(r => setTimeout(r, 1500)); // Espera a que el navegador dibuje

        const el = document.getElementById('contenedor-jugadores');
        if (!el) continue;

        try {
            const canvas = await html2canvas(el, { 
                backgroundColor: '#120024', // Color de tu CSS
                scale: 2, // Alta definición
                useCORS: true,
                logging: false 
            });

            const link = document.createElement('a');
            link.download = `Inventario_${j}.jpg`;
            link.href = canvas.toDataURL("image/jpeg", 0.9);
            link.click();
        } catch (err) {
            console.error("Error capturando a " + j, err);
        }
    }
    
    // Volvemos al menú OP automáticamente
    window.mostrarPagina(paginaActual.replace('pag-', ''));
    alert("Descargas finalizadas.");
}

export function descargarEstadoCSV() {
    let csv = "\uFEFFObjeto,Tipo,Material,Efecto,Rareza,Dueños,Cantidades\n"; // BOM para Excel
    Object.keys(objGlobal).sort().forEach(o => {
        const info = objGlobal[o];
        let d = [], c = [];
        Object.keys(invGlobal).forEach(jug => {
            if (invGlobal[jug][o] > 0) { d.push(jug); c.push(invGlobal[jug][o]); }
        });
        if (d.length > 0) csv += `"${o}","${info.tipo}","${info.mat}","${info.eff}","${info.rar}","${d.join(',')}","${c.join(',')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HEX_ESTADO_${new Date().toLocaleDateString()}.csv`;
    link.click();
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

export function descargarLog() {
    let csv = "Fecha,Jugador,Objeto,Cambio,Total\n";
    historial.forEach(h => csv += `"${h.fecha}","${h.jugador}","${h.objeto}",${h.cambio},${h.total}\n`);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'log_hex.csv'; link.click();
}

export function resetDB() { if(confirm("¿Borrar todo?")) { localStorage.clear(); location.reload(); } }