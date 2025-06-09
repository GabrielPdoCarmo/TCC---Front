import api from '../api';
export const deletePet = async (id: number) => {
  try {
    const response = await api.delete(`/pets/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export default deletePet;
