import api from '../api';

export const getPetsByRaca = async (raca_id: number) => {
  try {
    const response = await api.get(`/pets/raca/${raca_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar pets por raça', error);
    return [];
  }
};

export default getPetsByRaca;