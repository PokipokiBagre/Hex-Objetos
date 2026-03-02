import { invGlobal, objGlobal, historial, estadoUI } from './obj-state.js';
import { cargarTodoDesdeCSV } from './obj-data.js';
import { modificar, descargarLog, descargarEstadoCSV, descargarInventariosJPG, agregarObjetoManual } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP, dibujarInventarios, dibujarCatalogo, dibujarControl, dibujarCreacionObjeto } from './obj-ui.js';

async function iniciar() {
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") { localStorage.removeItem('hex_obj_v4'); }
    const cache = localStorage.getItem('hex_obj_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else { const p = JSON.parse(cache); Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj); historial.push(...(p.his || [])); }
    
    // SISTEMA DE POP-UP MOVIBLE CORREGIDO
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

    window.verImagen = (url) => {
        modalImg.src = url; modalImg.style.left = '50%'; modalImg.style.top = '50%'; 
        modalImg.style.transform = 'translate(-50%, -50%)'; modalImg.style.margin = 'auto'; modal.style.display = 'flex';
    };

    window.verImagenByName = (name) => {
        const norm = name.toString().trim().toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/\s+/g,'_').replace(/[^a-z0-9ñ_]/g,'');
        window.verImagen(`../img/imgobjetos/${norm}.png`);
    };

    // ACTUALIZACIÓN EN TIEMPO REAL PARA CREACIÓN (RESTAURADO)
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

    const _session = 'Y2FuZXk=';
    window.copyToClipboard = (id) => { const area = document.getElementById(id); area.select(); document.execCommand('copy'); };
    window.limpiarLog = () => { estadoUI.logCopy = ""; refrescarUI(); };
    window.actualizarTodo = async () => { if(confirm("¿Sincronizar datos?")) { await cargarTodoDesdeCSV(); alert("OK"); refrescarUI(); } };
    
    // GENERADOR DE REGISTRO CON xNUM (RESTAURADO)
    window.hexMod = (j, o, c) => {
        const tag = c > 0 ? "OO" : "OP";
        const mult = Math.abs(c) > 1 ? ` x${Math.abs(c)}` : "";
        estadoUI.logCopy = `<${j} | ${tag}: ${o}${mult} | ${objGlobal[o]?.eff || "Sin efecto"}>`;
        modificar(j, o, c, refrescarUI);
    };

    window.ejecutarSyncLog = () => {
        if (estadoUI.esAdmin) { dibujarMenuOP(); window.mostrarPagina('op-menu'); return; }
        const i = prompt("System Code:"); if (i === atob(_session)) { estadoUI.esAdmin = true; dibujarMenuOP(); window.mostrarPagina('op-menu'); }
    };

    window.mostrarCreacionObjeto = () => { window.mostrarPagina('control'); dibujarCreacionObjeto(); };
    window.ejecutarAgregarObjeto = () => {
        const datos = { nombre: document.getElementById('new-obj-name').value.trim(), tipo: document.getElementById('new-obj-tipo').value, mat: document.getElementById('new-obj-mat').value, eff: document.getElementById('new-obj-eff').value.trim(), rar: document.getElementById('new-obj-rar').value };
        const rep = {}; document.querySelectorAll('.cant-input').forEach(i => rep[i.dataset.player] = i.value);
        if(!datos.nombre) return alert("Nombre vacío");
        agregarObjetoManual(datos, rep, () => { alert("Objeto Creado"); refrescarUI(); window.mostrarPagina('op-menu'); });
    };

    window.mostrarPagina = (id) => { 
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none'); 
        const target = document.getElementById('pag-' + id);
        if(target) target.style.display = 'block'; refrescarUI(); 
    };

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
