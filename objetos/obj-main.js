import { invGlobal, objGlobal, historial, estadoUI } from './obj-state.js';
import { cargarTodoDesdeCSV } from './obj-data.js';
import { modificar, descargarLog, descargarEstadoCSV, descargarInventariosJPG } from './obj-logic.js';
import { refrescarUI, dibujarMenuOP, dibujarInventarios, dibujarCatalogo, dibujarControl } from './obj-ui.js';

async function iniciar() {
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
        localStorage.removeItem('hex_obj_v4');
    }

    const cache = localStorage.getItem('hex_obj_v4');
    if (!cache) await cargarTodoDesdeCSV();
    else { const p = JSON.parse(cache); Object.assign(invGlobal, p.inv); Object.assign(objGlobal, p.obj); historial.push(...(p.his || [])); }
    
    // SISTEMA DE POP-UP GLOBAL MOVIBLE
    const modal = document.createElement('div');
    modal.id = 'hex-modal-view';
    modal.className = 'hex-modal';
    modal.innerHTML = `<img id="hex-modal-img" src="" draggable="false">`;
    document.body.appendChild(modal);

    const modalImg = document.getElementById('hex-modal-img');
    let isDragging = false, startX, startY, initialX, initialY;

    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Lógica para mover la imagen con el ratón
    modalImg.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        initialX = modalImg.offsetLeft; initialY = modalImg.offsetTop;
        e.preventDefault();
    };
    window.onmousemove = (e) => {
        if (!isDragging) return;
        modalImg.style.left = (initialX + (e.clientX - startX)) + 'px';
        modalImg.style.top = (initialY + (e.clientY - startY)) + 'px';
    };
    window.onmouseup = () => { isDragging = false; };

    window.verImagen = (url) => {
        modalImg.src = url;
        modalImg.style.left = '0px'; modalImg.style.top = '0px'; 
        modal.style.display = 'flex';
    };

    const _session = 'Y2FuZXk=';
    window.copyToClipboard = (id) => { const area = document.getElementById(id); area.select(); document.execCommand('copy'); };
    window.limpiarLog = () => { estadoUI.cambiosSesion = {}; estadoUI.logCopy = ""; refrescarUI(); };
    
    window.actualizarBitacoraTexto = () => {
        let lines = [];
        for (const j in estadoUI.cambiosSesion) {
            for (const o in estadoUI.cambiosSesion[j]) {
                const c = estadoUI.cambiosSesion[j][o]; if (c === 0) continue;
                lines.push(`<${j} | ${c > 0 ? "OO" : "OP"}: ${o}${Math.abs(c) > 1 ? ' x' + Math.abs(c) : ''} | ${objGlobal[o]?.eff || "..."}>`);
            }
        }
        estadoUI.logCopy = lines.join('\n'); refrescarUI();
    };

    window.hexMod = (j, o, c) => {
        if (!estadoUI.cambiosSesion[j]) estadoUI.cambiosSesion[j] = {};
        estadoUI.cambiosSesion[j][o] = (estadoUI.cambiosSesion[j][o] || 0) + c;
        if (estadoUI.cambiosSesion[j][o] === 0) delete estadoUI.cambiosSesion[j][o];
        window.actualizarBitacoraTexto(); modificar(j, o, c, refrescarUI);
    };

    window.actualizarTodo = async () => { if(confirm("¿Sincronizar?")) { await cargarTodoDesdeCSV(); refrescarUI(); alert("OK"); } };
    
    window.ejecutarSyncLog = () => {
        if (estadoUI.esAdmin) { dibujarMenuOP(); window.mostrarPagina('op-menu'); return; }
        const i = prompt("System Code:"); if (i === atob(_session)) { estadoUI.esAdmin = true; dibujarMenuOP(); window.mostrarPagina('op-menu'); }
    };

    window.mostrarPagina = (id) => { 
        document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none'); 
        const target = document.getElementById('pag-' + id);
        if(target) target.style.display = 'block'; 
        refrescarUI(); 
    };

    // Vinculación de botones al objeto global window
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

