const API_URL = 'https://script.google.com/macros/s/AKfycbwNDwCKT9P25UaDQQXP2yAT1ZnvnZ8uDOFRFiGgp6i9eLwgnpUNYRpY-2MdExFmZqil9g/exec';

export let dbHechizos = null;

export async function cargarDataHechizos() {
    try {
        const respuesta = await fetch(API_URL);
        dbHechizos = await respuesta.json();
        console.log("Registros obtenidos con éxito:", dbHechizos);
        return true;
    } catch (error) {
        console.error("Fallo de conexión con la base de datos:", error);
        return false;
    }
}
