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
    let isDragging = false, offsetX, offsetY;

    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Lógica de movimiento suave basada en el punto de clic
    modalImg.onmousedown = (e) => {
        isDragging = true;
        const rect = modalImg.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        modalImg.style.cursor = 'grabbing';
        modalImg.style.left = rect.left + 'px'; // Fijamos posición actual en píxeles
        modalImg.style.top = rect.top + 'px';
        modalImg.style.transform = 'none'; // Quita el centrado CSS inicial para moverlo
        e.preventDefault();
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        modalImg.style.left = (e.clientX - offsetX) + 'px';
        modalImg.style.top = (e.clientY - offsetY) + 'px';
    };

    window.onmouseup = () => { isDragging = false; modalImg.style.cursor = 'grab'; };

    window.verImagen = (url) => {
        modalImg.src = url;
        modalImg.style.left = '50%'; modalImg.style.top = '50%'; 
        modalImg.style.transform = 'translate(-50%, -50%)'; // Reset posición inicial centrada
        modal.style.display = 'flex';
    };

    window.verImagenByName = (name) => {
        const normalized = name.toString().trim().toLowerCase()
            .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u')
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9ñ_]/g, '');
        window.verImagen(`../img/imgobjetos/${normalized}.png`);
    };

    // Funciones globales vinculadas a window
    const _session = 'Y2FuZXk=';
    window.copyToClipboard = (id) => { const area = document.getElementById(id); area.select(); document.execCommand('copy'); };
    window.limpiarLog = () => { estadoUI.cambiosSesion = {}; estadoUI.logCopy = ""; refrescarUI(); };
    window.actualizarTodo = async () => { if(confirm("¿Sincronizar datos?")) { await cargarTodoDesdeCSV(); refrescarUI(); alert("OK"); } };
    
    window.hexMod = (j, o, c) => {
        if (!estadoUI.cambiosSesion[j]) estadoUI.cambiosSesion[j] = {};
        estadoUI.cambiosSesion[j][o] = (estadoUI.cambiosSesion[j][o] || 0) + c;
        if (estadoUI.cambiosSesion[j][o] === 0) delete estadoUI.cambiosSesion[j][o];
        let lines = [];
        for (const player in estadoUI.cambiosSesion) {
            for (const item in estadoUI.cambiosSesion[player]) {
                const count = estadoUI.cambiosSesion[player][item]; if (count === 0) continue;
                lines.push(`<${player} | ${count > 0 ? "OO" : "OP"}: ${item} | ${objGlobal[item]?.eff || "..."}>`);
            }
        }
        estadoUI.logCopy = lines.join('\n');
        modificar(j, o, c, refrescarUI);
    };

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
