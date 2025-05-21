// Em adicionarFavorito.ts
import api from "../api";

export const getFavorito = async (usuario_id: number, pet_id: number) => {
  try {
    const response = await api.post(`/favoritos/usuario/${usuario_id}/pet/${pet_id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao adicionar o pet ${pet_id} aos favoritos do usuário ${usuario_id}`, error);
    return null;
  }
};

export default getFavorito;