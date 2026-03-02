export let statsGlobal = {}; 
export let estadoUI = {
    personajeActivo: null,
    esAdmin: false,
    paginaActiva: 'publico',
    principales: [] // Prioridad para el catálogo
};

export function guardar() { 
    localStorage.setItem('hex_stats_vFinal', JSON.stringify(statsGlobal)); 
}
