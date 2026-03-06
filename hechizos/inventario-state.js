export let db = {
    personajes: {}, csvHeadersPersonajes: [],
    hechizos: { nodos: [], nodosOcultos: [], inventario: [], string: [] }
};

export let estadoUI = {
    vistaActual: 'catalogo', personajeSeleccionado: null, esAdmin: false,
    filtroRol: 'Todos', filtroAct: 'Todos',
    filtrosGrimorio: { afinidad: 'Todos', busqueda: '' },
    filtrosGestion: { afinidad: 'Todos', clase: 'Todos', busqueda: '' },
    restarHexAsignacion: true,
    colaCambios: { agregar: [], quitar: [] }
};
