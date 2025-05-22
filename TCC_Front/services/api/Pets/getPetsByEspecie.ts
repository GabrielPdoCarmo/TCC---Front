import api from '../api';

export const getPetsByEspecie = async (especie_id: number) => {
  try {
    const response = await api.get(`/pets/especie/${especie_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar pets por espécie', error);
    return [];
  }
};

export default getPetsByEspecie;