import api from '../api';
export const updateStatus = async (id: number) => {
  try {
    const response = await api.put(`/pets/status/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export default updateStatus;
