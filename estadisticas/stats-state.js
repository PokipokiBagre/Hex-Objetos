export let statsGlobal = {};
export let listaEstados = []; 
export let estadoUI = {
    vistaActual: 'catalogo',
    personajeSeleccionado: null,
    esAdmin: false,
    filtroRol: 'Todos',
    filtroAct: 'Todos',
    party: [null, null, null, null, null, null], // Slots de los 6 jugadores
    hexLog: {}, // Memoria del Log Agrupado Inteligente
    selectorIndex: null, // Para saber a qué slot asignamos el jugador
    modoSincronizado: true // Sincronización a 10s activada por defecto
};

export function guardar() {
    localStorage.setItem('hex_stats_v2', JSON.stringify({ 
        stats: statsGlobal,
        party: estadoUI.party,
        modoSync: estadoUI.modoSincronizado
    }));
}
