import api from '../api';
export const getSexoPetById = async (id: number) => {
  try {
    const response = await api.get(`/sexoPet/${id}`);
    return {
      id: response.data.id,
      descricao: response.data.descricao,
    };
  } catch (error) {
    throw error;
  }
};
export default getSexoPetById;
