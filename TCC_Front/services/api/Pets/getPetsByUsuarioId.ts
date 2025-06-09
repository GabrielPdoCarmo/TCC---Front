import api from '../api';

export const getPetsByUsuarioId = async (usuario_id: number) => {
  try {
    const response = await api.get(`/pets/usuario/${usuario_id}`);
    return response.data;
  } catch (error) {
    return [];
  }
};
export default getPetsByUsuarioId;
