export let statsGlobal = {}; 
export let estadoUI = {
    personajeActivo: null,
    esAdmin: false,
    paginaActiva: 'publico',
    principales: [] 
};

export function guardar() { 
    localStorage.setItem('hex_stats_vPersistence', JSON.stringify(statsGlobal)); 
}
