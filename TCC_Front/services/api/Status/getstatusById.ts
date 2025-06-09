import api from '../api';
export const getstatusById = async (id: number) => {
  try {
    const response = await api.get(`/status/${id}`);

    return {
      id: response.data.id,
      nome: response.data.nome,
    };
  } catch (error) {
    throw error;
  }
};

export default getstatusById;
