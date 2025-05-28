import api from '../api';

export const getByNomePet_StatusId = async (nome: string) => {
  try {
    const response = await api.get(`/pets/nome/${nome}/status`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pets por nome e status ID:', error);
    throw error;
  }
};

export default getByNomePet_StatusId;