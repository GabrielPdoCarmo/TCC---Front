import api from '../api';

export const deleteMyPet = async (pet_id: number, usuario_id: number) => {
  try {
    const response = await api.delete(`/mypets/pets/${pet_id}/usuario/${usuario_id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export default deleteMyPet;
