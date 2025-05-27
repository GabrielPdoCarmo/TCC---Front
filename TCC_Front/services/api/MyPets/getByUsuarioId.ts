import api from '../api';

export const getByUsuarioId = async (usuario_id: number) => {
  try {
    const response = await api.get(`/mypets/usuario/${usuario_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pets por usuário ID:', error);
    throw error;
  }
};
export default getByUsuarioId;
