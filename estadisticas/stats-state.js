export let statsGlobal = {}; 
export let estadoUI = {
    personajeActivo: null,
    esAdmin: false,
    paginaActiva: 'publico',
    principales: [] // IDs de personajes que tienen objetos
};

export function guardar() { localStorage.setItem('hex_stats_v2', JSON.stringify(statsGlobal)); }
