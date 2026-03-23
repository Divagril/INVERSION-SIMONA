import axios from 'axios';

const API_URL = 'https://inversion-simona-backend.onrender.com/api'; 

export const getInversiones = () => axios.get(`${API_URL}/inversiones`).then(r => r.data);
export const guardarInversion = (d: any) => axios.post(`${API_URL}/productos/inversion`, d);
export const actualizarInversion = (id: string, d: any) => axios.put(`${API_URL}/inversiones/${id}`, d);
export const eliminarInversion = (id: string) => axios.delete(`${API_URL}/inversiones/${id}`);
export const getProductos = () => axios.get(`${API_URL}/productos`).then(r => r.data);

interface FiltrosRentabilidad {
  desde?: string;
  hasta?: string;
  producto?: string;
  [key: string]: any; // Permite cualquier otra propiedad dinámica
}
export const getRentabilidad = async (filtros: any = {}) => {
    const params = new URLSearchParams({ 
        ...filtros, 
        t: Date.now().toString() // Esto limpia el caché del navegador
    }).toString();
    const res = await axios.get(`${API_URL}/dashboard/rentabilidad?${params}`);
    return res.data;
};

export const getNombresInversiones = async () => {
    const res = await axios.get(`${API_URL}/nombres-inversiones`);
    return res.data;
};