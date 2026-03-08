import { misGlobal, estadoUI } from './mis-state.js';
import { cargarDatos, sincronizarBD } from './mis-data.js';
import { dibujarTablero, dibujarRoster, renderFormularioModal } from './mis-ui.js';
import { asignarJugador, removerJugador, guardarMision, eliminarPersonalizada } from './mis-logic.js';

window.onload = async () => {
    // Borrar cache si hace F5
    const perf = performance.getEntriesByType("navigation")[0];
    if (perf && perf.type === "reload") localStorage.removeItem('hex_mis_v1');

    await cargarDatos();
    dibujarRoster();
    dibujarTablero();
};

window.abrirMenuOP = () => { 
    if (estadoUI.esAdmin) { estadoUI.esAdmin = false; alert("Modo OP Desactivado"); }
    else {
        if (prompt("Contraseña MÁSTER:") === atob('Y2FuZXk=')) estadoUI.esAdmin = true;
    }
    dibujarTablero();
};

window.cambiarFiltroFinalizadas = () => {
    estadoUI.verFinalizadas = !estadoUI.verFinalizadas;
    const btn = document.getElementById('btn-filtro-fin');
    btn.innerText = `Ver Finalizadas: ${estadoUI.verFinalizadas ? 'SÍ' : 'NO'}`;
    btn.style.background = estadoUI.verFinalizadas ? 'var(--gold)' : '#111';
    btn.style.color = estadoUI.verFinalizadas ? '#000' : 'var(--gold)';
    dibujarTablero();
};

// DRAG & DROP LOGIC
window.dragStart = (e, playerName) => {
    e.dataTransfer.setData('text/plain', playerName);
};
window.dragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
};
window.dragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
};
window.dropPlayer = (e, misionId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const playerName = e.dataTransfer.getData('text/plain');
    if (playerName) asignarJugador(misionId, playerName);
};
window.quitarJugador = (misionId, playerName) => {
    if(confirm(`¿Remover a ${playerName} de esta misión?`)) removerJugador(misionId, playerName);
};

// MODALES
window.abrirModalCrear = (tipoForzado = null) => {
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const modal = document.getElementById('modal-mision');
    
    title.innerText = "FORJAR NUEVA MISIÓN";
    body.innerHTML = renderFormularioModal({ tipo: tipoForzado || 'Personalizada', clase:'1', estado:1, cupos:0, desc:'', autor:'', titulo:'', notaOP:'' });
    modal.classList.remove('oculto');
};

window.abrirModalEditar = (id) => {
    const m = misGlobal.find(mis => mis.id === id);
    if(!m) return;
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const modal = document.getElementById('modal-mision');
    
    title.innerText = `EDITAR: ${m.titulo}`;
    body.innerHTML = renderFormularioModal(m);
    modal.classList.remove('oculto');
};

window.cerrarModal = () => { document.getElementById('modal-mision').classList.add('oculto'); };

window.ejecutarGuardarMision = () => {
    const id = document.getElementById('form-id').value;
    const titulo = document.getElementById('form-titulo').value.trim();
    if(!titulo) return alert("El título no puede estar vacío.");

    const tipo = document.getElementById('form-tipo') ? document.getElementById('form-tipo').value : 'Personalizada';
    
    const datos = {
        id, titulo, tipo,
        clase: document.getElementById('form-clase').value,
        estado: parseInt(document.getElementById('form-estado').value) || 0,
        cupos: parseInt(document.getElementById('form-cupos').value) || 0,
        autor: document.getElementById('form-autor').value.trim(),
        desc: document.getElementById('form-desc').value.trim(),
        notaOP: document.getElementById('form-notaOP') ? document.getElementById('form-notaOP').value.trim() : ''
    };

    guardarMision(datos);
    window.cerrarModal();
};

window.eliminarMis = (id) => { if(confirm("¿Borrar esta misión?")) eliminarPersonalizada(id); };

window.ejecutarSincronizacion = async () => {
    const btn = document.getElementById('btn-sync-global');
    btn.innerText = "Sincronizando..."; btn.disabled = true;
    if(await sincronizarBD()) {
        estadoUI.colaCambios.misiones = {};
        const c = document.createElement('div'); c.innerText = "¡Misiones Guardadas! ✅";
        c.style.cssText = "position:fixed; top:30px; left:50%; transform:translateX(-50%); background:var(--gold); color:#000; padding:15px 40px; border-radius:8px; font-weight:bold; font-size:1.2em; z-index:99999;";
        document.body.appendChild(c);
        setTimeout(() => window.location.reload(), 1200);
    } else {
        alert("Error guardando misiones en Google Sheets.");
        btn.disabled = false; btn.innerText = "Reintentar Sync";
    }
};
