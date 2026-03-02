export let statsGlobal = {}; 
export let estadoUI = {
    esAdmin: false,
    paginaActiva: 'publico',
    personajesPrincipales: [] 
};

export function guardar() { 
    localStorage.setItem('hex_stats_v2', JSON.stringify(statsGlobal)); 
}
