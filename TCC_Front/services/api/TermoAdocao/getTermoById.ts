import api from '../api';

export const getTermoById = async (id: string) => {
  try {
    const response = await api.get(`/termos-compromisso/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar termo por ID', error);
    throw error;
  }
};

export default getTermoById;
