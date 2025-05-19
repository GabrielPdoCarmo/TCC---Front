import api from '../api';

export const getPetById = async (id: number) => {
  try {
    const response = await api.get(`/pets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar os pets pelo id', error);
    return [];
  }
};
export default getPetById;