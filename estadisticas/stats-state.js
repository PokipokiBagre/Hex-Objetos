export let statsGlobal = {}; 
export let estadoUI = {
    esAdmin: false,
    paginaActiva: 'publico',
    principales: [] 
};

export function guardar() { 
    localStorage.setItem('hex_stats_v2', JSON.stringify(statsGlobal)); 
}
