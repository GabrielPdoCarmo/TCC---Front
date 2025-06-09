// Em adicionarFavorito.ts
import api from '../api';

export const getFavorito = async (usuario_id: number, pet_id: number) => {
  try {
    const response = await api.post(`/favoritos/usuario/${usuario_id}/pet/${pet_id}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export default getFavorito;
