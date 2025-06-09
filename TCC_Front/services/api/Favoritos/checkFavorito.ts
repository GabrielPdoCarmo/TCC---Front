import api from '../api';

export const checkFavorito = async (usuario_id: number, pet_id: number) => {
  try {
    const response = await api.get(`/favoritos/usuario/${usuario_id}/pet/${pet_id}/check`);
    return response.data.isFavorito;
  } catch (error) {
    return false; // Retorna false em caso de erro, assumindo que não é favorito
  }
};
export default checkFavorito;
