export let statsGlobal = {};
export let listaEstados = []; 
export let estadoUI = {
    vistaActual: 'catalogo',
    personajeSeleccionado: null,
    esAdmin: false,
    filtroRol: 'Todos',
    filtroAct: 'Todos',
    party: [null, null, null, null, null, null], // Memoria de los 6 slots
    hexLog: {}, // Memoria del Log Agrupado Inteligente
    selectorIndex: null, // Índice para saber qué slot se está editando
    modoSincronizado: true // Sincronización Automática a 10s activada por defecto
};

export function guardar() {
    localStorage.setItem('hex_stats_v2', JSON.stringify({ 
        stats: statsGlobal,
        party: estadoUI.party,
        modoSync: estadoUI.modoSincronizado
    }));
}
