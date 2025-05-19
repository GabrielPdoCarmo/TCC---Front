import api from '../api';

export const getPetsByUsuarioId = async (usuario_id: number) => {
  try {
    const response = await api.get(`/pets/usuario/${usuario_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar os pets do usuário', error);
    return [];
  }
};
export default getPetsByUsuarioId;
