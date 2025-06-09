import api from '../api';

export const getPetById = async (id: number) => {
  try {
    const response = await api.get(`/pets/${id}`);
    return response.data;
  } catch (error) {
    return [];
  }
};
export default getPetById;
