export let statsGlobal = {}; 
export let estadoUI = {
    jugadorActivo: null, // Solo mantenemos quién está seleccionado
    esAdmin: false,
    paginaActiva: 'publico'
};

export function guardarStats() {
    localStorage.setItem('hex_stats_v1', JSON.stringify(statsGlobal));
}
