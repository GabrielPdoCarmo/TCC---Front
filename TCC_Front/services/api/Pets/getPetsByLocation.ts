import api from '../api';

export const getPetsByLocation = async (estado_id: number, cidade_id: number) => {
  try {
    const response = await api.get(`/pets/estado/${estado_id}/cidade/${cidade_id}`);
    return response.data;
  } catch (error) {
    return [];
  }
};

export default getPetsByLocation;
