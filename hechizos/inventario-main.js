import { dbHechizos, cargarDataHechizos } from './inventario-data.js';

async function iniciarInventario() {
    const loader = document.getElementById('loader');
    const selector = document.getElementById('selector-personaje');
    
    const exito = await cargarDataHechizos();
    
    if (!exito || !dbHechizos || !dbHechizos.inventario) {
        loader.innerText = "Error: Conexión rechazada o base de datos vacía.";
        loader.style.color = "var(--red-alert)";
        return;
    }
    
    // Obtenemos todos los personajes que posean al menos un hechizo en el Excel
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

    // Filtramos solo las filas del inventario que le correspondan al personaje
    const hechizosDelPersonaje = dbHechizos.inventario.filter(item => item.Personaje === nombrePersonaje);

    if (hechizosDelPersonaje.length === 0) {
        grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color:#aaa; font-family:sans-serif;">El registro de ${nombrePersonaje} está vacío.</p>`;
        return;
    }

    // Juntamos ambos diccionarios para que el código pueda buscar tanto hechizos públicos como ocultos
    const todosLosNodos = [...(dbHechizos.nodos || []), ...(dbHechizos.nodosOcultos || [])];

    hechizosDelPersonaje.forEach(itemInv => {
        const nombreHechizo = itemInv.Hechizo || 'Desconocido';
        
        // Cruzamos la data buscando el nombre del hechizo en los Nodos
        const infoNodo = todosLosNodos.find(n => n.Nombre === nombreHechizo) || {};

        const afinidad = itemInv["Hechizo Afinidad"] || infoNodo.Afinidad || 'Ninguna';
        const hexCosto = itemInv["Hechizo Hex"] || infoNodo.HEX || '0';
        const tipo = itemInv.Tipo || 'Normal';
        const origen = itemInv.Origen || '-';
        
        // Filtro para ignorar celdas basura de la base de datos (0, null, vacíos o Desconocido)
        const esValido = (val) => val && val !== '0' && val !== 0 && val !== 'Desconocido' && val !== 'null';
        
        const resumenHTML = esValido(infoNodo.resumen) ? `<div class="spell-desc">${infoNodo.resumen}</div>` : '';
        const efectoHTML = esValido(infoNodo.efecto) ? `<div class="spell-efecto">⚡ Efecto: ${infoNodo.efecto}</div>` : '';
        const overcastHTML = esValido(infoNodo['overcast 100%']) ? `<div class="spell-extra"><strong>Overcast:</strong> ${infoNodo['overcast 100%']}</div>` : '';
        const undercastHTML = esValido(infoNodo['undercast 50%']) ? `<div class="spell-extra"><strong>Undercast:</strong> ${infoNodo['undercast 50%']}</div>` : '';
        const especialHTML = esValido(infoNodo.especial) ? `<div class="spell-extra"><strong>Especial:</strong> ${infoNodo.especial}</div>` : '';

        // Estética: Asignamos el color temático del borde de la carta según su Afinidad
        let borderColor = '#555'; 
        let textColor = '#fff';
        if(afinidad === 'Física') { borderColor = '#8b4513'; textColor = '#e2a673'; }
        else if(afinidad === 'Energética') { borderColor = '#e67e22'; textColor = '#f3b67a'; }
        else if(afinidad === 'Espiritual') { borderColor = '#2ecc71'; textColor = '#7df0a7'; }
        else if(afinidad === 'Mando') { borderColor = '#3498db'; textColor = '#a4d3f2'; }
        else if(afinidad === 'Psíquica') { borderColor = '#9b59b6'; textColor = '#dcb1f0'; }
        else if(afinidad === 'Oscura') { borderColor = 'var(--purple-magic)'; textColor = '#c285ff'; }

        const tarjetaHTML = `
            <div class="spell-card" style="border-top: 3px solid ${borderColor};">
                <h3 style="color: ${textColor}">${nombreHechizo}</h3>
                
                <div class="spell-tags">
                    <span class="spell-tag tag-hex">HEX: ${hexCosto}</span>
                    <span class="spell-tag" style="border-color:${borderColor}; color:${textColor};">${afinidad}</span>
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
