import api from '../api';

export const getPetByName = async (nome: string) => {
  try {
    // 🆕 CORREÇÃO 1: Codificar o nome para URL
    const nomeEncoded = encodeURIComponent(nome.trim());

    const response = await api.get(`/pets/nome/${nomeEncoded}`);

    return response.data;
  } catch (error) {
    return null;
  }
};

export default getPetByName;
