export let statsGlobal = {}; 
export let estadoUI = {
    personajeActivo: null,
    esAdmin: false,
    paginaActiva: 'publico'
};

export function guardar() { 
    localStorage.setItem('hex_stats_vFusion', JSON.stringify(statsGlobal)); 
}
