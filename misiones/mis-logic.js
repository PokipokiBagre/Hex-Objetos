import { misGlobal, estadoUI } from './mis-state.js';
import { dibujarTablero, actualizarBotonSync } from './mis-ui.js';

export function encolarCambioMision(idMision) {
    const m = misGlobal.find(mis => mis.id === idMision);
    if (!m) return;
    
    if(!estadoUI.colaCambios.misiones[idMision]) estadoUI.colaCambios.misiones[idMision] = {};
    const sync = estadoUI.colaCambios.misiones[idMision];
    
    sync['Titulo'] = m.titulo;
    sync['Tipo'] = m.tipo;
    sync['Clase'] = m.clase;
    sync['Descripcion'] = m.desc;
    sync['Autor'] = m.autor;
    sync['Estado'] = m.estado;
    sync['Jugadores'] = m.jugadores.join(',');
    sync['MaxCupos'] = m.cupos;
    sync['NotaOP'] = m.notaOP;
    
    actualizarBotonSync();
}

export function verificarLimites() {
    // Cuenta activas (Pendientes 1 o En Proceso 2)
    const activasGrandes = misGlobal.filter(m => m.tipo === 'Grande' && (m.estado === 1 || m.estado === 2));
    const activasNormales = misGlobal.filter(m => m.tipo === 'Normal' && (m.estado === 1 || m.estado === 2));

    // Si exceden el límite, desactiva las más antiguas (las que están más abajo en el array/orden)
    if (activasGrandes.length > 7) {
        // Ordenamos por su orden original descendente (las últimas agregadas primero)
        activasGrandes.sort((a,b) => b.orden - a.orden);
        const aDesactivar = activasGrandes.slice(7); // Tomamos las que sobran
        aDesactivar.forEach(m => { m.estado = 0; encolarCambioMision(m.id); });
    }

    if (activasNormales.length > 14) {
        activasNormales.sort((a,b) => b.orden - a.orden);
        const aDesactivar = activasNormales.slice(14);
        aDesactivar.forEach(m => { m.estado = 0; encolarCambioMision(m.id); });
    }
}

export function asignarJugador(idMision, nombreJugador) {
    const m = misGlobal.find(mis => mis.id === idMision);
    if(!m) return;
    
    // Normal no puede tocar Grandes/Normales
    if (!estadoUI.esAdmin && (m.tipo === 'Grande' || m.tipo === 'Normal')) {
        alert("Solo el OP puede modificar los cupos de misiones Grandes o Normales.");
        return;
    }

    if (!m.jugadores.includes(nombreJugador)) {
        m.jugadores.push(nombreJugador);
        encolarCambioMision(idMision);
        dibujarTablero();
    }
}

export function removerJugador(idMision, nombreJugador) {
    const m = misGlobal.find(mis => mis.id === idMision);
    if(!m) return;

    if (!estadoUI.esAdmin && (m.tipo === 'Grande' || m.tipo === 'Normal')) {
        alert("Solo el OP puede modificar los cupos de misiones Grandes o Normales.");
        return;
    }

    m.jugadores = m.jugadores.filter(j => j !== nombreJugador);
    encolarCambioMision(idMision);
    dibujarTablero();
}

export function guardarMision(datos) {
    let m = misGlobal.find(mis => mis.id === datos.id);
    if (!m) {
        m = { ...datos, jugadores: [], orden: misGlobal.length };
        misGlobal.push(m);
    } else {
        Object.assign(m, datos);
    }
    
    verificarLimites();
    encolarCambioMision(m.id);
    dibujarTablero();
}

export function eliminarPersonalizada(id) {
    const idx = misGlobal.findIndex(m => m.id === id);
    if (idx > -1) {
        const m = misGlobal[idx];
        if (m.tipo !== 'Personalizada' && !estadoUI.esAdmin) return alert("Solo puedes borrar personalizadas.");
        misGlobal.splice(idx, 1);
        
        // Lo marcamos en cola para que se borre o pase a estado "Borrado" (Para CSV es mejor poner Estado = -1 o Inactiva)
        if(!estadoUI.colaCambios.misiones[id]) estadoUI.colaCambios.misiones[id] = {};
        estadoUI.colaCambios.misiones[id]['Estado'] = 0; 
        
        actualizarBotonSync();
        dibujarTablero();
    }
}
