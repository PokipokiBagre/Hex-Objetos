export let statsGlobal = {}; 
export let estadoUI = {
    personajeActivo: null,
    esAdmin: false,
    paginaActiva: 'publico',
    principales: [] 
};

export function guardar() { 
    localStorage.setItem('hex_stats_vFinal_v3', JSON.stringify(statsGlobal)); 
}
