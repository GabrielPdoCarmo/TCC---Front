import api from '../api';

export const checkFavorito = async (usuario_id: number, pet_id: number) => {
  try {
    const response = await api.get(`/favoritos/usuario/${usuario_id}/pet/${pet_id}/check`);
    return response.data.isFavorito;
  } catch (error) {
    console.error(`Erro ao verificar se o pet ${pet_id} está nos favoritos do usuário ${usuario_id}`, error);
    return false; // Retorna false em caso de erro, assumindo que não é favorito
  }
};
export default checkFavorito;
