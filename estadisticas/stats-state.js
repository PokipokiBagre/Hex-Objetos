export let statsGlobal = {};
export let listaEstados = []; 
export let estadoUI = {
    vistaActual: 'catalogo',
    personajeSeleccionado: null,
    esAdmin: false,
    filtroRol: 'Todos',
    filtroAct: 'Todos',
    party: [null, null, null, null, null, null], // Memoria de los 6 slots
    hexLog: {}, // Memoria de la bitácora unificada
    selectorIndex: null // Usado para el modal emergente
};

export function guardar() {
    localStorage.setItem('hex_stats_v2', JSON.stringify({ 
        stats: statsGlobal,
        party: estadoUI.party 
    }));
}
