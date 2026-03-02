import { statsGlobal, estadoUI } from './stats-state.js';
import { calcularTodo } from './stats-logic.js';

/**
 * Función principal que redibuja la interfaz.
 * Se encarga de pintar el catálogo de personajes o el diseñador OP.
 */
export function refrescarUI() {
    // 1. Dibujar Catálogo de Personajes (Cuadrilla 4x4)
    const container = document.getElementById('contenedor-catalog');
    if (!container) return;

    // Ordenar: Principales (con objetos) primero, luego el resto alfabéticamente
    const ids = Object.keys(statsGlobal).sort((a, b) => {
        const pA = estadoUI.principales.includes(a) ? 0 : 1;
        const pB = estadoUI.principales.includes(b) ? 0 : 1;
        return pA - pB || a.localeCompare(b);
    });

    container.innerHTML = ids.map(id => {
        const d = calcularTodo(id);
        const img = `../img/imgpersonajes/${id.toLowerCase()}icon.png`;
        
        return `
            <div class="personaje-card" onclick="window.verDetallePersonaje('${id}')">
                <div class="header-card">
                    <img src="${img}" class="img-p" onerror="this.src='../img/icon.png'">
                    <span style="color:#d4af37; font-weight:bold; letter-spacing:1px;">${id.toUpperCase()}</span>
                    ${estadoUI.principales.includes(id) ? '<small style="color:#0f0; font-size:0.6em;">PRINCIPAL</small>' : ''}
                </div>
                
                <div class="bar-container">
                    <div class="bar-fill bar-red" style="width:${(d.roja / d.rojaMax) * 100}%"></div>
                    <div class="bar-text">${d.roja} / ${d.rojaMax} ❤️</div>
                </div>
                
                <div class="bar-container">
                    <div class="bar-fill bar-blue" style="width:100%"></div>
                    <div class="bar-text">${d.azul} Corazones 💙</div>
                </div>

                <div class="afin-grid">
                    <div class="afin-box"><label>FIS</label><span>${d.afin[0]}</span></div>
                    <div class="afin-box"><label>ENE</label><span>${d.afin[1]}</span></div>
                    <div class="afin-box"><label>ESP</label><span>${d.afin[2]}</span></div>
                    <div class="afin-box"><label>MAN</label><span>${d.afin[3]}</span></div>
                    <div class="afin-box"><label>PSI</label><span>${d.afin[4]}</span></div>
                    <div class="afin-box"><label>OSC</label><span>${d.afin[5]}</span></div>
                </div>
            </div>
        `;
    }).join('');

    // 2. Si hay un personaje activo (detalle), se puede dibujar debajo o en un modal
    if (estadoUI.personajeActivo) {
        dibujarFichaDetalle(estadoUI.personajeActivo);
    }
}

/**
 * Muestra la ficha detallada con biografía y hechizos si se desea ver a fondo un personaje.
 */
function dibujarFichaDetalle(id) {
    const dash = document.getElementById('dashboard-stats');
    if (!dash) return;
    
    const s = statsGlobal[id];
    const d = calcularTodo(id);

    dash.innerHTML = `
        <div class="stat-card">
            <button onclick="window.cerrarDetalle()" style="float:right; background:#444;">CERRAR</button>
            <div style="display:flex; align-items:center; gap:25px; border-bottom:1px solid #d4af3744; padding-bottom:20px; margin-bottom:20px;">
                <img src="../img/imgpersonajes/${id.toLowerCase()}icon.png" style="width:100px; height:100px; border:2px solid #d4af37; border-radius:50%;" onerror="this.src='../img/icon.png'">
                <div style="text-align:left;">
                    <h2 style="margin:0; color:#d4af37;">${s.nombreFull}</h2>
                    <p style="font-size:0.85em; color:#ddd; margin:8px 0;">${s.bio}</p>
                </div>
            </div>
            
            <h3 style="color:#d4af37; border-bottom:1px solid #d4af3722;">HECHIZOS APRENDIDOS</h3>
            <table class="spell-table">
                <tr><th>Afinidad</th><th>Hechizo</th><th>Costo Hex</th></tr>
                ${d.spells.map(h => `<tr><td style="color:#d4af37">${h.afin}</td><td>${h.nom}</td><td>${h.hex}</td></tr>`).join('')}
            </table>
        </div>
    `;
}

/**
 * Interfaz del Diseñador OP para crear nuevos personajes y generar su línea CSV.
 */
export function dibujarDisenador() {
    const adminPanel = document.getElementById('panel-op-stats');
    if (!adminPanel) return;

    adminPanel.innerHTML = `
        <div class="stat-card" style="max-width:600px; margin: 0 auto; border-style: dashed;">
            <h2 style="margin-top:0;">DISEÑADOR DE PERSONAJE</h2>
            <p style="font-size:0.8em; opacity:0.7;">Completa los datos para generar la entrada del CSV maestro.</p>
            
            <div style="display:grid; gap:10px; text-align:left;">
                <label>ID Único (Ej: Linda):</label>
                <input type="text" id="new-id" placeholder="Nombre corto..." style="width:95%; padding:10px; background:#1a0033; color:white; border:1px solid #d4af37;">
                
                <label>Nombre Completo:</label>
                <input type="text" id="new-nom" placeholder="Nombre y Apellidos..." style="width:95%; padding:10px; background:#1a0033; color:white; border:1px solid #d4af37;">
                
                <label>Biografía / Descripción:</label>
                <textarea id="new-bio" placeholder="Breve historia del personaje..." style="width:95%; height:80px; padding:10px; background:#1a0033; color:white; border:1px solid #d4af37;"></textarea>
                
                <div style="margin-top:15px;">
                    <button onclick="window.crearPersonaje()" style="width:100%; background:#006400; color:white; border:none; padding:15px;">GENERAR Y DESCARGAR CSV</button>
                    <button onclick="window.mostrarPagina('publico')" style="width:100%; margin-top:10px; background:#444; border:none;">VOLVER</button>
                </div>
            </div>
        </div>
    `;
}
