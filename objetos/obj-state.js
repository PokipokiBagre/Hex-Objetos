export let invGlobal = {}; 
export let objGlobal = {}; 
export let historial = []; 
export let estadoUI = {
    vistaActual: 'grilla',
    jugadorControl: null, 
    jugadorInv: null, 
    filtroRar: 'Todos', 
    filtroMat: 'Todos',
    busquedaOP: "", 
    busquedaCat: "", 
    busquedaInv: "", 
    logCopy: "", 
    esAdmin: false,
    cambiosSesion: {},
    modoSincronizado: true, // Switch Auto a 10s
    partyLoot: [], // Jugadores seleccionados en el OP
    lootMult: 1, // Modificador (x1, x5, etc)
    transOrigen: null, // Para transferencias
    transDestino: null
};

export function guardar() { 
    localStorage.setItem('hex_obj_v4', JSON.stringify({ 
        inv: invGlobal, 
        obj: objGlobal, 
        his: historial,
        modoSync: estadoUI.modoSincronizado 
    })); 
}
