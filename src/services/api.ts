import axios from 'axios';

const API_URL = 'https://inversion-simona-backend.onrender.com/api';

export const getInversiones = () => axios.get(`${API_URL}/inversiones`).then(r => r.data);
export const guardarInversion = (d: any) => axios.post(`${API_URL}/productos/inversion`, d);
export const actualizarInversion = (id: string, d: any) => axios.put(`${API_URL}/inversiones/${id}`, d);
export const eliminarInversion = (id: string) => axios.delete(`${API_URL}/inversiones/${id}`);
export const getProductos = () => axios.get(`${API_URL}/productos`).then(r => r.data);

export const getRentabilidad = async (filtros: any = {}) => {
    // Convierte el objeto filtros en texto para la URL (?desde=...&hasta=...)
    const params = new URLSearchParams(filtros).toString();
    const res = await axios.get(`${API_URL}/dashboard/rentabilidad?${params}`);
    return res.data;
};

export const getNombresInversiones = async () => {
    const res = await axios.get(`${API_URL}/nombres-inversiones`);
    return res.data; // Esto devolverá un array de strings: ["Aceite", "Arroz", ...]
};
