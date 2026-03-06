import { dbHechizos, cargarDataHechizos } from './inventario-data.js';

async function iniciarInventario() {
    const loader = document.getElementById('loader');
    const selector = document.getElementById('selector-personaje');
    
    const exito = await cargarDataHechizos();
    
    if (!exito || !dbHechizos) {
        loader.innerText = "Error al cargar la base de datos.";
        loader.style.color = "#ff4444";
        return;
    }
    
    // Extraer lista de personajes únicos y ordenar alfabéticamente
    const personajesUnicos = [...new Set(dbHechizos.inventario.map(item => item.Personaje))].filter(Boolean).sort();
    
    selector.innerHTML = '<option value="" disabled selected>-- Seleccionar Personaje --</option>';
    personajesUnicos.forEach(pj => {
        selector.innerHTML += `<option value="${pj}">${pj}</option>`;
    });
    
    selector.disabled = false;
    loader.style.display = 'none';

    selector.addEventListener('change', (e) => {
        dibujarInventarioPersonaje(e.target.value);
    });
}

function dibujarInventarioPersonaje(nombrePersonaje) {
    const grid = document.getElementById('grid-inventario');
    grid.innerHTML = ''; 

    // Filtrar inventario
    const hechizosDelPersonaje = dbHechizos.inventario.filter(item => item.Personaje === nombrePersonaje);

    if (hechizosDelPersonaje.length === 0) {
        grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color:#aaa;">No se encontraron hechizos para este personaje.</p>`;
        return;
    }

    // Combinar Nodos Públicos y Ocultos
    const todosLosNodos = [...(dbHechizos.nodos || []), ...(dbHechizos.nodosOcultos || [])];

    hechizosDelPersonaje.forEach(itemInv => {
        const nombreHechizo = itemInv.Hechizo || 'Desconocido';
        
        // Buscar coincidencia exacta en las tablas de nodos
        const infoNodo = todosLosNodos.find(n => n.Nombre === nombreHechizo) || {};

        // Extraer variables base (Priorizando el Inventario, luego los Nodos)
        const afinidad = itemInv["Hechizo Afinidad"] || infoNodo.Afinidad || 'Ninguna';
        const hexCosto = itemInv["Hechizo Hex"] || infoNodo.HEX || '0';
        const tipo = itemInv.Tipo || 'Normal';
        const origen = itemInv.Origen || '-';
        
        // Extraer descripciones, ignorando "0", "Desconocido" o vacíos
        const esValido = (val) => val && val !== '0' && val !== 0 && val !== 'Desconocido';
        
        const resumenHTML = esValido(infoNodo.resumen) ? `<div class="spell-desc">${infoNodo.resumen}</div>` : '';
        const efectoHTML = esValido(infoNodo.efecto) ? `<div class="spell-efecto">Efecto: ${infoNodo.efecto}</div>` : '';
        const overcastHTML = esValido(infoNodo['overcast 100%']) ? `<div class="spell-extra"><strong>Overcast:</strong> ${infoNodo['overcast 100%']}</div>` : '';
        const undercastHTML = esValido(infoNodo['undercast 50%']) ? `<div class="spell-extra"><strong>Undercast:</strong> ${infoNodo['undercast 50%']}</div>` : '';
        const especialHTML = esValido(infoNodo.especial) ? `<div class="spell-extra"><strong>Especial:</strong> ${infoNodo.especial}</div>` : '';

        // Colores de borde por afinidad
        let borderColor = '#555'; 
        if(afinidad === 'Física') borderColor = '#8b4513';
        if(afinidad === 'Energética') borderColor = '#e67e22';
        if(afinidad === 'Espiritual') borderColor = '#2ecc71';
        if(afinidad === 'Mando') borderColor = '#3498db';
        if(afinidad === 'Psíquica') borderColor = '#9b59b6'; 
        if(afinidad === 'Oscura') borderColor = '#4a235a';

        const tarjetaHTML = `
            <div class="spell-card" style="border-left: 4px solid ${borderColor};">
                <h3 style="color: ${borderColor}">${nombreHechizo}</h3>
                
                <div class="spell-tags">
                    <span class="spell-tag tag-hex">HEX: ${hexCosto}</span>
                    <span class="spell-tag" style="border-color:${borderColor}; color:${borderColor};">${afinidad}</span>
                    <span class="spell-tag tag-tipo">${tipo}</span>
                </div>
                
                ${resumenHTML}
                ${efectoHTML}
                ${overcastHTML}
                ${undercastHTML}
                ${especialHTML}
                
                <div class="tag-origen">Origen: ${origen}</div>
            </div>
        `;

        grid.innerHTML += tarjetaHTML;
    });
}

window.onload = iniciarInventario;
