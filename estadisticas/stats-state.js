export let statsGlobal = {}; 
export let estadoUI = {
    jugadorActivo: null,
    esAdmin: false,
    paginaActiva: 'publico',
    logStats: ""
};

export function guardarStats() {
    localStorage.setItem('hex_stats_v1', JSON.stringify(statsGlobal));
}
