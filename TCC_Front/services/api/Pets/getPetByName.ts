import api from '../api';

export const getPetByName = async (nome: string) => {
  try {
    const response = await api.get(`/pets/nome/${nome}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar pet por nome', error);
    return null;
  }
};

export default getPetByName;