import api from '../api';

export const getByNomePet_StatusId = async (nome: string, status_id: number = 3) => {
  try {
    // Validar se o status_id é 3 ou 4
    if (status_id !== 3 && status_id !== 4) {
      throw new Error('Status ID deve ser 3 ou 4');
    }

    const response = await api.get(`/pets/nome/${nome}/status/${status_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pets por nome e status ID:', error);
    throw error;
  }
};

export default getByNomePet_StatusId;