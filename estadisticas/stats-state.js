export let statsGlobal = {}; 
export let estadoUI = {
    personajeActivo: null,
    esAdmin: false,
    paginaActiva: 'publico',
    principales: [] 
};

export function guardar() { 
    localStorage.setItem('hex_stats_v5', JSON.stringify(statsGlobal)); 
}
