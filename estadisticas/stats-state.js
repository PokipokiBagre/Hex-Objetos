export let statsGlobal = {};
export let listaEstados = []; 
export let estadoUI = {
    vistaActual: 'catalogo',
    personajeSeleccionado: null,
    esAdmin: false,
    filtroRol: 'Todos',
    filtroAct: 'Todos',
    party: [null, null, null, null, null, null], 
    hexLog: {}
};

// Contenedor para las otras bases de datos
export let dbExtra = {
    objetos: {}, // Guarda { "linda": 15, "corvin": 8 }
    hechizos: { inventario: [], nodos: [], nodosOcultos: [] }
};

export function guardar() {
    localStorage.setItem('hex_stats_v2', JSON.stringify({ 
        stats: statsGlobal,
        party: estadoUI.party
    }));
}
