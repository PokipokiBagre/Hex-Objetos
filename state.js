export let invGlobal = {}; export let objGlobal = {}; export let historial = []; 
export let estadoUI = {
    jugadorControl: null, jugadorInv: null, filtroRar: 'Todos', filtroMat: 'Todos',
    busquedaOP: "", busquedaCat: "", busquedaInv: "", esAdmin: false
};
export function guardar() { 
    localStorage.setItem('hex_obj_v4', JSON.stringify({ inv: invGlobal, obj: objGlobal, his: historial })); 
}