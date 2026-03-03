export let statsGlobal = {};
export let listaEstados = []; // NUEVO: El diccionario maestro de estados
export let estadoUI = {
    vistaActual: 'catalogo',
    personajeSeleccionado: null,
    esAdmin: false,
    filtroRol: 'Todos',
    filtroAct: 'Todos'
};

export function guardar() {
    localStorage.setItem('hex_stats_v2', JSON.stringify({ stats: statsGlobal }));
}
