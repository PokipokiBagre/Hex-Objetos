import { invGlobal, objGlobal, historial, estadoUI } from './obj-state.js';
import { cargarTodoDesdeCSV } from './obj-data.js';
import { modificar, descargarLog, descargarEstadoCSV, descargarInventariosJPG, agregarObjetoManual } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP, dibujarInventarios, dibujarCatalogo, dibujarControl, dibujarCreacionObjeto } from './obj-ui.js';

async function iniciar() {
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") { localStorage.removeItem('hex_obj_v4'); }
    const cache = localStorage.getItem('hex_obj_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else { const p = JSON.parse(cache); Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj); historial.push(...(p.his || [])); }
    
    // BITÁCORA DE SESIÓN
    estadoUI.cambiosSesion = {};

    // POP-UP MOVIBLE
    const modal = document.createElement('div');
    modal.id = 'hex-modal-view'; modal.className = 'hex-modal';
    modal.innerHTML = `<img id="hex-modal-img" src="" draggable="false">`;
    document.body.appendChild(modal);
    const modalImg = document.getElementById('hex-modal-img');
    let isDragging = false, offsetX, offsetY;

    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    modalImg.onmousedown = (e) => {
        isDragging = true;
        const rect = modalImg.getBoundingClientRect();
        offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
        modalImg.style.cursor = 'grabbing'; modalImg.style.margin = '0';
        modalImg.style.left = rect.left + 'px'; modalImg.style.top = rect.top + 'px';
        modalImg.style.transform = 'none'; e.preventDefault();
    };
    window.onmousemove = (e) => { if (!isDragging) return; modalImg.style.left = (e.clientX - offsetX) + 'px'; modalImg.style.top = (e.clientY - offsetY) + 'px'; };
    window.onmouseup = () => { isDragging = false; modalImg.style.cursor = 'grab'; };

    window.verImagen = (url) => { modalImg.src = url; modalImg.style.left = '50%'; modalImg.style.top = '50%'; modalImg.style.transform = 'translate(-50%, -50%)'; modalImg.style.margin = 'auto'; modal.style.display = 'flex'; };
    window.verImagenByName = (name) => {
        const norm = name.toString().trim().toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/\s+/g,'_').replace(/[^a-z0-9ñ_]/g,'');
        window.verImagen(`../img/imgobjetos/${norm}.png`);
    };

    // GENERADOR DE REGISTRO ACUMULATIVO (RESTAURADO)
    const actualizarBitacoraAcumulada = () => {
        let lines = [];
        for (const player in estadoUI.cambiosSesion) {
            for (const item in estadoUI.cambiosSesion[player]) {
                const total = estadoUI.cambiosSesion[player][item];
                if (total === 0) continue;
                const tag = total > 0 ? "OO" : "OP";
                const mult = Math.abs(total) > 1 ? ` x${Math.abs(total)}` : "";
                lines.push(`<${player} | ${tag}: ${item}${mult} | ${objGlobal[item]?.eff || "..."}>`);
            }
        }
        estadoUI.logCopy = lines.join('\n');
    };

  window.limpiarLog = () => { estadoUI.cambiosSesion = {}; estadoUI.logCopy = ""; refrescarUI(); };

window.updateCreationLog = () => {
    const n = document.getElementById('new-obj-name').value || "Objeto";
    const e = document.getElementById('new-obj-eff').value || "Efecto";
    let l = [];
    document.querySelectorAll('.cant-input').forEach(i => {
        const c = parseInt(i.value) || 0;
        if (c > 0) l.push(`<${i.dataset.player} | OO: ${n}${c > 1 ? ' x'+c : ''} | ${e}>`);
    });
    const out = document.getElementById('copy-log-crea');
    if (out) out.value = l.join('\n');
};

window.mostrarCreacionObjeto = () => { 
    window.mostrarPagina('control'); // Navega al panel interactivo
    dibujarCreacionObjeto();        // Dibuja el formulario
};

window.hexMod = (j, o, c) => {
    // Acumular cambios en la sesión
    if (!estadoUI.cambiosSesion[j]) estadoUI.cambiosSesion[j] = {};
    estadoUI.cambiosSesion[j][o] = (estadoUI.cambiosSesion[j][o] || 0) + c;
    
    // Si el cambio neto vuelve a cero, lo quitamos del log
    if (estadoUI.cambiosSesion[j][o] === 0) delete estadoUI.cambiosSesion[j][o];

    // Generar el bloque de texto acumulado
    let lines = [];
    for (const player in estadoUI.cambiosSesion) {
        for (const item in estadoUI.cambiosSesion[player]) {
            const total = estadoUI.cambiosSesion[player][item];
            const tag = total > 0 ? "OO" : "OP";
            const mult = Math.abs(total) > 1 ? ` x${Math.abs(total)}` : "";
            lines.push(`<${player} | ${tag}: ${item}${mult} | ${objGlobal[item]?.eff || "..."}>`);
        }
    }
    estadoUI.logCopy = lines.join('\n');
    modificar(j, o, c, refrescarUI);
};

    // VINCULACIÓN GLOBAL
    const _session = 'Y2FuZXk=';
    window.copyToClipboard = (id) => { const area = document.getElementById(id); area.select(); document.execCommand('copy'); };
    window.actualizarTodo = async () => { if(confirm("¿Sincronizar datos?")) { await cargarTodoDesdeCSV(); alert("Sincronización OK"); refrescarUI(); } };
    window.ejecutarSyncLog = () => { if (estadoUI.esAdmin) { dibujarMenuOP(); window.mostrarPagina('op-menu'); return; } const i = prompt("Validation:"); if (i === atob(_session)) { estadoUI.esAdmin = true; dibujarMenuOP(); window.mostrarPagina('op-menu'); } };
    window.mostrarCreacionObjeto = () => { dibujarCreacionObjeto(); };
    window.ejecutarAgregarObjeto = () => {
        const d = { nombre: document.getElementById('new-obj-name').value.trim(), tipo: document.getElementById('new-obj-tipo').value, mat: document.getElementById('new-obj-mat').value, eff: document.getElementById('new-obj-eff').value.trim(), rar: document.getElementById('new-obj-rar').value };
        const rep = {}; document.querySelectorAll('.cant-input').forEach(i => rep[i.dataset.player] = i.value);
        if(!d.nombre) return alert("Nombre vacío");
        agregarObjetoManual(d, rep, () => { alert("Objeto Creado"); refrescarUI(); window.mostrarPagina('op-menu'); });
    };

    window.mostrarPagina = (id) => { document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none'); const t = document.getElementById('pag-' + id); if(t) t.style.display = 'block'; refrescarUI(); };
    window.setInv = (j) => { estadoUI.jugadorInv = j; dibujarInventarios(); };
    window.setCtrl = (j) => { estadoUI.jugadorControl = j; dibujarControl(); };
    window.setRar = (r) => { estadoUI.filtroRar = r; dibujarCatalogo(); };
    window.setMat = (m) => { estadoUI.filtroMat = m; dibujarCatalogo(); };
    window.setBusquedaInv = (v) => { estadoUI.busquedaInv = v; dibujarInventarios(); };
    window.setBusquedaCat = (v) => { estadoUI.busquedaCat = v; dibujarCatalogo(); };
    window.setBusquedaOP = (v) => { estadoUI.busquedaOP = v; dibujarControl(); };
    
    window.descargarEstadoCSV = descargarEstadoCSV; window.descargarInventariosJPG = descargarInventariosJPG; window.descargarLog = descargarLog;
    refrescarUI();
}
iniciar();


