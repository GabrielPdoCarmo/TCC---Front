import api from '../api';
export const deletePet = async (id: number) => {
  try {
    const response = await api.delete(`/pets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar o pet', error);
    throw error;
  }
};
export default deletePet;