import api from '../api';

export const createMyPet = async (pet_id: number, usuario_id: number) => {
  try {
    const response = await api.post('/mypets', {
      pet_id, // ← no body
      usuario_id, // ← no body
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export default createMyPet;
