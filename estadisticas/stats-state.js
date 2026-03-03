export let statsGlobal = {};
export let estadoUI = {
    vistaActual: 'catalogo',
    personajeSeleccionado: null
};

export function guardar() {
    localStorage.setItem('hex_stats_v1', JSON.stringify({ stats: statsGlobal }));
}
