import api from '../api';

export const getFavoritosPorUsuario = async (usuario_id: number) => {
  try {
    const response = await api.get(`/favoritos/usuario/${usuario_id}`);
    return response.data;
  } catch (error) {
    return null;
  }
};
export default getFavoritosPorUsuario;
